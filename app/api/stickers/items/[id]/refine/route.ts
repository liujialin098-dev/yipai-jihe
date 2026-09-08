import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/wardrobe/validation";
import { WARDROBE_BUCKET } from "@/lib/wardrobe/ingestion";
import {
  ownedSticker,
  REFINEMENT_MAX_BYTES,
  RefinementError,
  refinementVersion,
  saveStickerRefinement,
} from "@/lib/stickers/refinement";

export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Origin",
  "X-Content-Type-Options": "nosniff",
};
type Context = { params: Promise<{ id: string }> };
function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof RefinementError ? error.message : "save_unavailable",
    },
    { status: error instanceof RefinementError ? error.status : 503, headers },
  );
}
async function identity(context: Context) {
  const { id } = await context.params;
  if (!isUuid(id)) throw new RefinementError(400, "item_invalid");
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new RefinementError(401, "session_required");
  return { id, client, userId: data.user.id };
}
export async function GET(request: Request, context: Context) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new RefinementError(403, "request_forbidden");
    const { id, client, userId } = await identity(context);
    const item = await ownedSticker(client, userId, id);
    const result = await client.storage
      .from(WARDROBE_BUCKET)
      .download(item.path);
    if (result.error || !result.data)
      throw new RefinementError(503, "image_unavailable");
    return new Response(result.data, {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        ETag: refinementVersion(item.path),
      },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    if (
      request.headers.get("origin") !== new URL(request.url).origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      throw new RefinementError(403, "request_forbidden");
    if (request.headers.get("content-type") !== "image/png")
      throw new RefinementError(422, "image_invalid");
    const { id, client, userId } = await identity(context);
    const reader = request.body?.getReader();
    if (!reader) throw new RefinementError(400, "image_missing");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > REFINEMENT_MAX_BYTES) {
          await reader.cancel();
          throw new RefinementError(413, "image_too_large");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const cutoutUrl = await saveStickerRefinement(
      client,
      userId,
      id,
      request.headers.get("if-match"),
      Buffer.concat(chunks),
    );
    for (const path of [
      "/",
      "/stickers",
      "/diary",
      "/wardrobe",
      "/recommendations",
      "/profile",
      "/favorites",
      `/wardrobe/${id}`,
    ])
      revalidatePath(path);
    return Response.json({ cutoutUrl }, { headers });
  } catch (error) {
    return failure(error);
  }
}
