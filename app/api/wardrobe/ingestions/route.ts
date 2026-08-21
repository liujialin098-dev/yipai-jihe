import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  cleanupExpiredIngestions,
  getIngestionRouteContext,
  jsonError,
  safeRequestJson,
  WARDROBE_BUCKET,
} from "@/lib/wardrobe/ingestion";
import { validateIngestionCreateRequest } from "@/lib/wardrobe/validation";

export async function POST(request: Request) {
  const context = await getIngestionRouteContext();
  if (!context) return jsonError("unauthorized", "会话尚未准备好。", 401);

  const validation = validateIngestionCreateRequest(
    await safeRequestJson(request),
  );
  if (!validation.success) {
    return jsonError(
      "invalid_file",
      "请选择 10MB 以内的 jpg 或 png 图片。",
      400,
    );
  }

  await cleanupExpiredIngestions(context);
  const { clientRequestId, mimeType, byteSize } = validation.data;
  const { data: existing } = await context.supabase
    .from("wardrobe_ingestions")
    .select("id, image_path, expires_at, status")
    .eq("user_id", context.userId)
    .eq("client_request_id", clientRequestId)
    .maybeSingle();

  if (existing?.status === "confirmed") {
    return jsonError("already_confirmed", "这张图片已经入库。", 409);
  }

  let ingestion = existing;
  let created = false;
  if (!ingestion) {
    const id = randomUUID();
    const extension = mimeType === "image/png" ? "png" : "jpg";
    const imagePath = `${context.userId}/ingestions/${id}.${extension}`;
    const { data, error } = await context.supabase
      .from("wardrobe_ingestions")
      .insert({
        id,
        user_id: context.userId,
        client_request_id: clientRequestId,
        image_path: imagePath,
        mime_type: mimeType,
        byte_size: byteSize,
      })
      .select("id, image_path, expires_at, status")
      .single();

    if (error || !data) {
      return jsonError("create_failed", "暂时无法建立上传任务。", 500);
    }
    ingestion = data;
    created = true;
  }

  const { data: signed, error: signedError } = await context.supabase.storage
    .from(WARDROBE_BUCKET)
    .createSignedUploadUrl(ingestion.image_path, { upsert: true });

  if (signedError || !signed?.token) {
    if (created) {
      await context.supabase
        .from("wardrobe_ingestions")
        .delete()
        .eq("id", ingestion.id)
        .eq("user_id", context.userId);
    }
    return jsonError("storage_sign_failed", "暂时无法准备图片上传。", 500);
  }

  return NextResponse.json(
    {
      ingestionId: ingestion.id,
      path: ingestion.image_path,
      token: signed.token,
      expiresAt: ingestion.expires_at,
    },
    { status: created ? 201 : 200 },
  );
}
