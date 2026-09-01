import { NextResponse } from "next/server";
import { after } from "next/server";
import { processProfessionalCutout } from "@/lib/outfits/professional-cutout";
import type { Json, TablesInsert } from "@/lib/supabase/database.types";
import {
  getIngestionRouteContext,
  isExpired,
  jsonError,
  safeRequestJson,
  storageObjectExists,
} from "@/lib/wardrobe/ingestion";
import {
  isRecord,
  isUuid,
  validateRecognitionResult,
  validateWardrobeItemJson,
  type WardrobeItemInput,
} from "@/lib/wardrobe/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const { id } = await route.params;
  if (!isUuid(id)) return jsonError("not_found", "未找到这张图片。", 404);

  const input = await safeRequestJson(request);
  const validation = validateWardrobeItemJson(input);
  if (!validation.success) {
    return jsonError("invalid_fields", "请修正标出的衣物信息。", 400, {
      fieldErrors: validation.fieldErrors,
    });
  }

  const context = await getIngestionRouteContext();
  if (!context) return jsonError("unauthorized", "会话尚未准备好。", 401);

  const { data: ingestion } = await context.supabase
    .from("wardrobe_ingestions")
    .select("id, image_path, expires_at, status, ai_result, wardrobe_item_id")
    .eq("id", id)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!ingestion) return jsonError("not_found", "未找到这张图片。", 404);

  if (ingestion.status === "confirmed" && ingestion.wardrobe_item_id) {
    return NextResponse.json({
      wardrobeItemId: ingestion.wardrobe_item_id,
      status: "confirmed",
    });
  }
  if (isExpired(ingestion.expires_at)) {
    return jsonError("expired", "这张待处理图片已过期，请重新选择。", 410);
  }
  if (!(await storageObjectExists(context, ingestion.image_path))) {
    return jsonError("image_missing", "原图尚未上传完成，请重试。", 409);
  }

  const row: TablesInsert<"wardrobe_items"> = {
    user_id: context.userId,
    source_ingestion_id: id,
    image_path: ingestion.image_path,
    ...validation.data,
  };
  const { data: wardrobeItem, error: upsertError } = await context.supabase
    .from("wardrobe_items")
    .upsert(row, { onConflict: "user_id,source_ingestion_id" })
    .select("id")
    .single();
  if (upsertError || !wardrobeItem) {
    return jsonError("save_failed", "暂时无法保存到衣橱，请重试。", 500);
  }

  const correctedFields = getCorrectedFields(
    ingestion.ai_result,
    validation.data,
  );
  const { error: updateError } = await context.supabase
    .from("wardrobe_ingestions")
    .update({
      status: "confirmed",
      wardrobe_item_id: wardrobeItem.id,
      corrected_fields: correctedFields,
      ai_result: isRecord(ingestion.ai_result)
        ? (ingestion.ai_result as Json)
        : null,
      failure_code: null,
    })
    .eq("id", id)
    .eq("user_id", context.userId);
  if (updateError) {
    return jsonError(
      "save_partial",
      "衣物已入库，状态同步暂未完成；再次确认即可恢复。",
      500,
      { wardrobeItemId: wardrobeItem.id },
    );
  }

  await context.supabase
    .from("profiles")
    .update({ onboarding_state: "ready" })
    .eq("user_id", context.userId);

  after(async () => {
    await processProfessionalCutout({
      itemId: wardrobeItem.id,
      supabase: context.supabase,
      userId: context.userId,
    });
  });

  return NextResponse.json({
    wardrobeItemId: wardrobeItem.id,
    status: "confirmed",
  });
}

function getCorrectedFields(
  aiResult: Json | null,
  finalResult: WardrobeItemInput,
) {
  const recognition = validateRecognitionResult(aiResult);
  if (!recognition.success) return Object.keys(finalResult);

  return (Object.keys(finalResult) as Array<keyof WardrobeItemInput>).flatMap(
    (key) => {
      const value = finalResult[key];
      const suggested = recognition.data[key];
      return JSON.stringify(value) === JSON.stringify(suggested) ? [] : [key];
    },
  );
}
