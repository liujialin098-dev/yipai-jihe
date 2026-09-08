import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createClient } from "@/lib/supabase/server";
import { WARDROBE_BUCKET } from "@/lib/wardrobe/ingestion";

type Client = Awaited<ReturnType<typeof createClient>>;
export const REFINEMENT_MAX_BYTES = 3 * 1024 * 1024;
export class RefinementError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function refinementVersion(path: string) {
  return `"${createHash("sha256").update(path).digest("hex")}"`;
}
export async function ownedSticker(
  client: Client,
  userId: string,
  itemId: string,
) {
  const { data, error } = await client
    .from("wardrobe_items")
    .select("id, cutout_path")
    .eq("id", itemId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data?.cutout_path?.startsWith(`${userId}/cutouts/`)) {
    throw new RefinementError(404, "sticker_missing");
  }
  return { id: data.id, path: data.cutout_path };
}
export async function validateRefinement(input: Uint8Array) {
  if (!input.length || input.length > REFINEMENT_MAX_BYTES)
    throw new RefinementError(413, "image_too_large");
  if (
    ![137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => input[index] === byte,
    )
  )
    throw new RefinementError(422, "image_invalid");
  try {
    const image = sharp(input, { limitInputPixels: 1280 * 1280 });
    const meta = await image.metadata();
    if (
      !meta.width ||
      !meta.height ||
      meta.width > 1280 ||
      meta.height > 1280 ||
      !meta.hasAlpha ||
      (meta.pages ?? 1) !== 1
    )
      throw new Error("invalid");
    const normalized = await image.ensureAlpha().png().toBuffer();
    const stats = await sharp(normalized).stats();
    if (stats.channels[3].min === 255 || stats.channels[3].max === 0)
      throw new Error("empty_or_opaque");
    return normalized;
  } catch {
    throw new RefinementError(422, "image_invalid");
  }
}
export async function saveStickerRefinement(
  client: Client,
  userId: string,
  itemId: string,
  version: string | null,
  input: Uint8Array,
) {
  const item = await ownedSticker(client, userId, itemId);
  if (version !== refinementVersion(item.path))
    throw new RefinementError(409, "sticker_changed");
  const png = await validateRefinement(input);
  const suffix = `${itemId}-${randomUUID()}.png`;
  const paths = [
    `${userId}/cutout-sources/${suffix}`,
    `${userId}/cutouts/${suffix}`,
  ];
  const bucket = client.storage.from(WARDROBE_BUCKET);
  let updateAttempted = false;
  let cutoutUrl = "";
  try {
    for (const path of paths) {
      const { error } = await bucket.upload(path, png, {
        contentType: "image/png",
        upsert: false,
        cacheControl: "31536000",
      });
      if (error) throw new RefinementError(503, "save_unavailable");
    }
    const signed = await bucket.createSignedUrl(paths[1], 1800);
    if (signed.error || !signed.data?.signedUrl)
      throw new RefinementError(503, "save_unavailable");
    cutoutUrl = signed.data.signedUrl;
    updateAttempted = true;
    const updated = await client
      .from("wardrobe_items")
      .update({ cutout_path: paths[1] })
      .eq("id", itemId)
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("cutout_path", item.path)
      .select("id")
      .maybeSingle();
    if (updated.error) throw new RefinementError(503, "save_unavailable");
    if (!updated.data) throw new RefinementError(409, "sticker_changed");
    // Keep the prior private version and the original photograph recoverable.
    return signed.data.signedUrl;
  } catch (error) {
    if (updateAttempted) {
      // A lost response can mean the pointer already committed. Never delete its image.
      try {
        const current = await ownedSticker(client, userId, itemId);
        if (current.path === paths[1]) return cutoutUrl;
      } catch {
        throw error;
      }
    }
    await bucket.remove(paths).catch(() => undefined);
    throw error;
  }
}
