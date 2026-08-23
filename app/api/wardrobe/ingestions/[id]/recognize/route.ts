import { NextResponse } from "next/server";
import type { Json } from "@/lib/supabase/database.types";
import {
  getIngestionRouteContext,
  isExpired,
  jsonError,
  removeIngestionObject,
  storageObjectExists,
  WARDROBE_BUCKET,
} from "@/lib/wardrobe/ingestion";
import {
  RecognitionError,
  recognizeWardrobeImage,
} from "@/lib/wardrobe/recognition";
import { isUuid } from "@/lib/wardrobe/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, route: RouteContext) {
  const { id } = await route.params;
  if (!isUuid(id)) return jsonError("not_found", "未找到这张图片。", 404);

  const context = await getIngestionRouteContext();
  if (!context) return jsonError("unauthorized", "会话尚未准备好。", 401);

  const { data: ingestion } = await context.supabase
    .from("wardrobe_ingestions")
    .select("id, image_path, expires_at, status")
    .eq("id", id)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!ingestion) return jsonError("not_found", "未找到这张图片。", 404);
  if (ingestion.status === "confirmed") {
    return jsonError("already_confirmed", "这张图片已经入库。", 409);
  }
  if (isExpired(ingestion.expires_at)) {
    if (await removeIngestionObject(context, ingestion.image_path)) {
      await context.supabase
        .from("wardrobe_ingestions")
        .delete()
        .eq("id", id)
        .eq("user_id", context.userId);
    }
    return jsonError("expired", "这张待处理图片已过期，请重新选择。", 410);
  }

  if (!(await storageObjectExists(context, ingestion.image_path))) {
    await context.supabase
      .from("wardrobe_ingestions")
      .update({ status: "failed", failure_code: "image_missing" })
      .eq("id", id)
      .eq("user_id", context.userId);
    return jsonError("image_missing", "图片尚未上传完成，请重试。", 409);
  }

  await context.supabase
    .from("wardrobe_ingestions")
    .update({
      status: "recognizing",
      ai_result: null,
      failure_code: null,
      recognition_ms: null,
    })
    .eq("id", id)
    .eq("user_id", context.userId);

  const { data: signed, error: signedError } = await context.supabase.storage
    .from(WARDROBE_BUCKET)
    .createSignedUrl(ingestion.image_path, 60);
  if (signedError || !signed?.signedUrl) {
    await markFailed(context, id, "image_missing", 0);
    return jsonError("image_missing", "暂时无法读取原图，请重试。", 409);
  }

  const startedAt = Date.now();
  try {
    const { result, model } = await recognizeWardrobeImage(signed.signedUrl);
    const recognitionMs = Date.now() - startedAt;
    const { error } = await context.supabase
      .from("wardrobe_ingestions")
      .update({
        status: "recognized",
        ai_result: result as unknown as Json,
        ai_model: model,
        recognition_ms: recognitionMs,
        failure_code: null,
      })
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error)
      return jsonError("save_failed", "识别完成，但结果暂时无法保存。", 500);

    return NextResponse.json({
      ingestionId: id,
      status: "recognized",
      result,
      recognitionMs,
    });
  } catch (error) {
    const recognitionMs = Date.now() - startedAt;
    const failure =
      error instanceof RecognitionError
        ? error
        : new RecognitionError("provider_error", 502);
    await markFailed(context, id, failure.code, recognitionMs);
    return jsonError(
      failure.code,
      failureMessage(failure.code, failure.reason),
      failure.httpStatus,
    );
  }
}

async function markFailed(
  context: NonNullable<Awaited<ReturnType<typeof getIngestionRouteContext>>>,
  id: string,
  failureCode:
    | "not_configured"
    | "timeout"
    | "rate_limited"
    | "provider_error"
    | "invalid_result"
    | "image_missing",
  recognitionMs: number,
) {
  await context.supabase
    .from("wardrobe_ingestions")
    .update({
      status: "failed",
      ai_result: null,
      failure_code: failureCode,
      recognition_ms: recognitionMs,
    })
    .eq("id", id)
    .eq("user_id", context.userId);
}

function failureMessage(code: string, reason?: "quota_exhausted") {
  if (reason === "quota_exhausted") {
    return "AI 识别额度已用完，可充值后重试或先手工填写。";
  }
  if (code === "not_configured") return "AI 识别尚未配置，可先手工填写。";
  if (code === "timeout") return "识别超时了，可重试或手工填写。";
  if (code === "rate_limited") return "识别请求较多，请稍后重试。";
  if (code === "invalid_result") return "识别结果不完整，请重试或手工填写。";
  return "AI 识别暂时不可用，可重试或手工填写。";
}
