"use server";

import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  type OutfitCanvasActionState,
  type OutfitCanvasInput,
  validateOutfitCanvasInput,
} from "@/lib/outfits/validation";
import { isUuid } from "@/lib/wardrobe/validation";

export async function saveWardrobeCutout(
  wardrobeItemId: string,
  storagePath: string,
): Promise<
  | { status: "success"; message: string; cutoutUrl: string }
  | { status: "error"; message: string }
> {
  if (!isUuid(wardrobeItemId)) {
    return { status: "error", message: "未找到这件衣物。" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { status: "error", message: "登录状态已失效，请刷新后重试。" };
  }

  const expectedPath = `${user.id}/cutouts/${wardrobeItemId}.png`;
  if (storagePath !== expectedPath) {
    return { status: "error", message: "抠图保存路径无效。" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("wardrobe_items")
    .update({ cutout_path: expectedPath })
    .eq("id", wardrobeItemId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) {
    return { status: "error", message: "抠图暂时无法绑定到这件衣物。" };
  }

  const signedResult = await supabase.storage
    .from("wardrobe-images")
    .createSignedUrl(expectedPath, 60 * 30);
  if (signedResult.error || !signedResult.data.signedUrl) {
    return { status: "error", message: "抠图已保存，请刷新后查看。" };
  }

  revalidatePath("/wardrobe");
  revalidatePath("/recommendations");
  return {
    status: "success",
    message: "已在本机完成抠图，原图仍然保留。",
    cutoutUrl: signedResult.data.signedUrl,
  };
}

export async function saveOutfitCanvas(
  input: OutfitCanvasInput,
): Promise<OutfitCanvasActionState> {
  const validation = validateOutfitCanvasInput(input);
  if (!validation.success) {
    return { status: "error", message: "画布内容不完整，请检查后重试。" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { status: "error", message: "登录状态已失效，请刷新后重试。" };
  }

  const value = validation.data;
  const itemIds = value.items.map((item) => item.wardrobeItemId);
  const { data: ownedItems, error: itemsError } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("id", itemIds);
  if (
    itemsError ||
    !ownedItems ||
    new Set(ownedItems.map((item) => item.id)).size !== itemIds.length
  ) {
    return {
      status: "error",
      message: "部分衣物已不可用，请返回推荐重新选择。",
    };
  }

  if (value.sourceRecommendationId) {
    const sourceResult = await supabase
      .from("daily_recommendations")
      .select("id")
      .eq("id", value.sourceRecommendationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sourceResult.error || !sourceResult.data) {
      return { status: "error", message: "来源推荐已不可用，请重新进入画布。" };
    }
  }

  const row = {
    user_id: user.id,
    title: value.title,
    background_theme: value.backgroundTheme,
    source_recommendation_id: value.sourceRecommendationId ?? null,
    source_slot: value.sourceSlot ?? null,
    items: value.items as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  let canvasId = value.canvasId;
  if (canvasId) {
    const updateResult = await supabase
      .from("outfit_canvases")
      .update(row)
      .eq("id", canvasId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (updateResult.error || !updateResult.data) {
      return { status: "error", message: "穿搭卡片暂时无法保存。" };
    }
  } else {
    const insertResult = await supabase
      .from("outfit_canvases")
      .insert(row)
      .select("id")
      .single();
    if (insertResult.error || !insertResult.data) {
      return { status: "error", message: "穿搭卡片暂时无法创建。" };
    }
    canvasId = insertResult.data.id;
  }

  revalidatePath(`/outfits/${canvasId}`);
  revalidatePath("/profile");
  revalidatePath("/recommendations");
  return {
    status: "success",
    message: "穿搭卡片已保存。",
    canvasId,
  };
}
