import { requestBaiduCutout } from "@/lib/outfits/baidu-cutout";
import type { createClient } from "@/lib/supabase/server";
import { WARDROBE_BUCKET } from "@/lib/wardrobe/ingestion";
import sharp from "sharp";

const OUTPUT_LIMIT_BYTES = 20 * 1024 * 1024;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10] as const;
const inFlight = new Map<string, Promise<ProfessionalCutoutResult>>();

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ProfessionalCutoutResult =
  | { status: "created" | "reused"; cutoutPath: string; cutoutUrl: string }
  | {
      status: "error";
      code:
        | "cutout_unavailable"
        | "image_invalid"
        | "image_missing"
        | "not_found";
    };

type ProcessInput = {
  force?: boolean;
  itemId: string;
  supabase: SupabaseClient;
  userId: string;
};

type RefineInput = Omit<ProcessInput, "force"> & { source: Blob };

export function processProfessionalCutout(input: ProcessInput) {
  const key = `${input.userId}:${input.itemId}`;
  const current = inFlight.get(key);
  if (current) return current;

  const pending = processProfessionalCutoutOnce(input).finally(() => {
    if (inFlight.get(key) === pending) inFlight.delete(key);
  });
  inFlight.set(key, pending);
  return pending;
}

export async function saveRefinedCutout({
  itemId,
  source,
  supabase,
  userId,
}: RefineInput): Promise<ProfessionalCutoutResult> {
  const itemResult = await supabase
    .from("wardrobe_items")
    .select("id, cutout_path")
    .eq("id", itemId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const item = itemResult.data;
  if (itemResult.error || !item) return { status: "error", code: "not_found" };
  if (source.size < 1 || source.size > OUTPUT_LIMIT_BYTES) {
    return { status: "error", code: "image_invalid" };
  }

  let assets: Awaited<ReturnType<typeof prepareCutoutAssets>>;
  try {
    assets = await prepareCutoutAssets(source);
  } catch {
    return { status: "error", code: "image_invalid" };
  }
  return persistCutoutAssets({
    assets,
    itemId,
    oldCutoutPath: item.cutout_path,
    supabase,
    userId,
  });
}

async function processProfessionalCutoutOnce({
  force = false,
  itemId,
  supabase,
  userId,
}: ProcessInput): Promise<ProfessionalCutoutResult> {
  const itemResult = await supabase
    .from("wardrobe_items")
    .select("id, image_path, cutout_path")
    .eq("id", itemId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const item = itemResult.data;
  if (itemResult.error || !item) return { status: "error", code: "not_found" };

  if (!force && item.cutout_path) {
    const signed = await createCutoutSignedUrl(supabase, item.cutout_path);
    if (signed) {
      return {
        status: "reused",
        cutoutPath: item.cutout_path,
        cutoutUrl: signed,
      };
    }
  }

  const original = await supabase.storage
    .from(WARDROBE_BUCKET)
    .download(item.image_path);
  if (original.error || !original.data) {
    return { status: "error", code: "image_missing" };
  }

  let output: Blob;
  try {
    output = await requestBaiduCutout(original.data);
  } catch (error) {
    return {
      status: "error",
      code:
        error instanceof Error && error.message === "image_invalid"
          ? "image_invalid"
          : "cutout_unavailable",
    };
  }

  let assets: Awaited<ReturnType<typeof prepareCutoutAssets>>;
  try {
    assets = await prepareCutoutAssets(output);
  } catch {
    return { status: "error", code: "cutout_unavailable" };
  }

  return persistCutoutAssets({
    assets,
    itemId,
    oldCutoutPath: item.cutout_path,
    supabase,
    userId,
  });
}

async function persistCutoutAssets({
  assets,
  itemId,
  oldCutoutPath,
  supabase,
  userId,
}: {
  assets: Awaited<ReturnType<typeof prepareCutoutAssets>>;
  itemId: string;
  oldCutoutPath: string | null;
  supabase: SupabaseClient;
  userId: string;
}): Promise<ProfessionalCutoutResult> {
  const version = crypto.randomUUID();
  const cutoutPath = `${userId}/cutouts/${itemId}-${version}.png`;
  const sourcePath = professionalSourcePath(cutoutPath);
  const sourceUpload = await supabase.storage
    .from(WARDROBE_BUCKET)
    .upload(sourcePath, assets.source, {
      cacheControl: "31536000",
      contentType: "image/png",
      upsert: false,
    });
  if (sourceUpload.error) {
    return { status: "error", code: "cutout_unavailable" };
  }
  const upload = await supabase.storage
    .from(WARDROBE_BUCKET)
    .upload(cutoutPath, assets.display, {
      cacheControl: "31536000",
      contentType: "image/png",
      upsert: false,
    });
  if (upload.error) {
    await supabase.storage.from(WARDROBE_BUCKET).remove([sourcePath]);
    return { status: "error", code: "cutout_unavailable" };
  }

  const cutoutUrl = await createCutoutSignedUrl(supabase, cutoutPath);
  if (!cutoutUrl) {
    await supabase.storage
      .from(WARDROBE_BUCKET)
      .remove([sourcePath, cutoutPath]);
    return { status: "error", code: "cutout_unavailable" };
  }

  const update = await supabase
    .from("wardrobe_items")
    .update({ cutout_path: cutoutPath })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (update.error || !update.data) {
    await supabase.storage
      .from(WARDROBE_BUCKET)
      .remove([sourcePath, cutoutPath]);
    return { status: "error", code: "cutout_unavailable" };
  }
  if (oldCutoutPath && oldCutoutPath !== cutoutPath) {
    await supabase.storage
      .from(WARDROBE_BUCKET)
      .remove([oldCutoutPath, professionalSourcePath(oldCutoutPath)]);
  }
  return { status: "created", cutoutPath, cutoutUrl };
}

export async function prepareCutoutAssets(output: Blob) {
  const input = Buffer.from(await output.arrayBuffer());
  const image = sharp(input, { limitInputPixels: 25_000_000 }).ensureAlpha();
  const normalized = await image
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });
  if (
    normalized.info.format !== "png" ||
    normalized.info.channels !== 4 ||
    normalized.info.width < 1 ||
    normalized.info.height < 1 ||
    normalized.info.width > 6000 ||
    normalized.info.height > 6000
  ) {
    throw new Error("cutout_unavailable");
  }
  const stats = await sharp(normalized.data).stats();
  const alpha = stats.channels[3];
  if (!alpha || alpha.min >= 255 || alpha.max <= 0) {
    throw new Error("cutout_unavailable");
  }
  const trimmed = await sharp(normalized.data)
    .trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 3,
    })
    .extend({
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  if (
    trimmed.byteLength < PNG_SIGNATURE.length ||
    trimmed.byteLength > OUTPUT_LIMIT_BYTES
  ) {
    throw new Error("cutout_unavailable");
  }
  return {
    source: new Blob([copyArrayBuffer(normalized.data)], { type: "image/png" }),
    display: new Blob([copyArrayBuffer(trimmed)], { type: "image/png" }),
  };
}

function copyArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function professionalSourcePath(cutoutPath: string) {
  return cutoutPath.replace("/cutouts/", "/cutout-sources/");
}

async function createCutoutSignedUrl(supabase: SupabaseClient, path: string) {
  const result = await supabase.storage
    .from(WARDROBE_BUCKET)
    .createSignedUrl(path, 60 * 30);
  return result.error ? null : result.data.signedUrl;
}
