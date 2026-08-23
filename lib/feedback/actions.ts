"use server";

import { revalidatePath } from "next/cache";
import {
  addFeedbackEvent,
  FEEDBACK_WEIGHTS,
  isWardrobeStyle,
  recalculatePreferenceScores,
} from "@/lib/feedback/preferences";
import { getActiveRecommendationItems } from "@/lib/recommendations/data";
import {
  parseRecommendationOccasion,
  validateRecommendationOutput,
  validateWeatherSnapshot,
} from "@/lib/recommendations/validation";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { WardrobeStyle } from "@/lib/wardrobe/constants";

export type FeedbackActionState = {
  status: "idle" | "success" | "error";
  message: string;
  isFavorite?: boolean;
};

async function authenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function toggleItemFavorite(
  _state: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const wardrobeItemId = String(formData.get("wardrobeItemId") ?? "");
  const intent = formData.get("intent") === "remove" ? "remove" : "add";
  const { supabase, user } = await authenticatedContext();
  if (!user) return { status: "error", message: "体验会话已失效。" };

  const itemResult = await supabase
    .from("wardrobe_items")
    .select("id, style")
    .eq("id", wardrobeItemId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (
    itemResult.error ||
    !itemResult.data ||
    !isWardrobeStyle(itemResult.data.style)
  ) {
    return { status: "error", message: "这件衣物已不可用。" };
  }
  const existingFavorite = await supabase
    .from("wardrobe_item_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("wardrobe_item_id", wardrobeItemId)
    .maybeSingle();
  if (intent === "add" && existingFavorite.data) {
    return {
      status: "success",
      message: "这件衣物已经收藏。",
      isFavorite: true,
    };
  }
  if (intent === "remove" && !existingFavorite.data) {
    return {
      status: "success",
      message: "这件衣物已不在收藏中。",
      isFavorite: false,
    };
  }

  if (intent === "add") {
    const result = await supabase
      .from("wardrobe_item_favorites")
      .upsert(
        { user_id: user.id, wardrobe_item_id: wardrobeItemId },
        { onConflict: "user_id,wardrobe_item_id", ignoreDuplicates: true },
      );
    if (result.error) return { status: "error", message: "收藏暂时失败。" };
  } else {
    const result = await supabase
      .from("wardrobe_item_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("wardrobe_item_id", wardrobeItemId);
    if (result.error) return { status: "error", message: "取消收藏暂时失败。" };
  }

  await addFeedbackEvent(supabase, {
    userId: user.id,
    eventKey: `${intent}-item:${wardrobeItemId}:${crypto.randomUUID()}`,
    eventType: intent === "add" ? "favorite_item" : "unfavorite_item",
    style: itemResult.data.style,
    weight:
      intent === "add"
        ? FEEDBACK_WEIGHTS.favoriteItem
        : -FEEDBACK_WEIGHTS.favoriteItem,
    wardrobeItemId,
  });
  await recalculatePreferenceScores(supabase, user.id);
  revalidatePath("/favorites");
  revalidatePath("/recommendations");
  revalidatePath(`/wardrobe/${wardrobeItemId}`);
  return {
    status: "success",
    message: intent === "add" ? "已收藏这件衣物。" : "已取消收藏。",
    isFavorite: intent === "add",
  };
}

export async function toggleOutfitFavorite(
  _state: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const recommendationId = String(formData.get("recommendationId") ?? "");
  const requestedSourceKey = String(formData.get("sourceKey") ?? "");
  const slotValue = Number(formData.get("slot"));
  const intent = formData.get("intent") === "remove" ? "remove" : "add";
  if (![1, 2, 3].includes(slotValue)) {
    return { status: "error", message: "穿搭位置无效。" };
  }

  const { supabase, user } = await authenticatedContext();
  if (!user) return { status: "error", message: "体验会话已失效。" };

  if (intent === "remove" && requestedSourceKey) {
    const favoriteResult = await supabase
      .from("outfit_favorites")
      .select("outfit")
      .eq("user_id", user.id)
      .eq("source_key", requestedSourceKey)
      .maybeSingle();
    const snapshot = favoriteResult.data?.outfit;
    const styleTags =
      snapshot &&
      typeof snapshot === "object" &&
      !Array.isArray(snapshot) &&
      Array.isArray(snapshot.styleTags)
        ? snapshot.styleTags.filter(
            (style): style is WardrobeStyle =>
              typeof style === "string" && isWardrobeStyle(style),
          )
        : [];
    const deleteResult = await supabase
      .from("outfit_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("source_key", requestedSourceKey);
    if (deleteResult.error) {
      return { status: "error", message: "取消收藏暂时失败。" };
    }
    for (const style of styleTags) {
      await addFeedbackEvent(supabase, {
        userId: user.id,
        eventKey: `remove-outfit:${requestedSourceKey}:${style}:${crypto.randomUUID()}`,
        eventType: "unfavorite_outfit",
        style,
        weight: -FEEDBACK_WEIGHTS.favoriteOutfit,
        recommendationId: recommendationId || null,
        outfitSlot: slotValue,
      });
    }
    await recalculatePreferenceScores(supabase, user.id);
    revalidatePath("/recommendations");
    revalidatePath("/favorites");
    return {
      status: "success",
      message: "已取消整套收藏。",
      isFavorite: false,
    };
  }

  const recommendationResult = await supabase
    .from("daily_recommendations")
    .select("id, occasion, weather, outfits, updated_at")
    .eq("id", recommendationId)
    .eq("user_id", user.id)
    .maybeSingle();
  const row = recommendationResult.data;
  const occasion = row ? parseRecommendationOccasion(row.occasion) : null;
  const weather = row ? validateWeatherSnapshot(row.weather) : null;
  const items = await getActiveRecommendationItems(supabase, user.id);
  const outfits =
    row && occasion && weather && items
      ? validateRecommendationOutput(
          { outfits: row.outfits },
          items,
          occasion,
          weather,
        )
      : null;
  const outfit = outfits?.find((candidate) => candidate.slot === slotValue);
  if (!row || !occasion || !weather || !outfit || !items) {
    return { status: "error", message: "这套推荐已更新，请刷新后再试。" };
  }
  const sourceKey = `${row.id}:${row.updated_at}:${slotValue}`;

  if (intent === "add") {
    const existingFavorite = await supabase
      .from("outfit_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_key", sourceKey)
      .maybeSingle();
    if (existingFavorite.data) {
      return {
        status: "success",
        message: "这套穿搭已经收藏。",
        isFavorite: true,
      };
    }
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const snapshotItems = outfit.itemIds.flatMap((id) => {
      const item = itemMap.get(id);
      return item ? [{ id: item.id, name: item.name, style: item.style }] : [];
    });
    const result = await supabase.from("outfit_favorites").upsert(
      {
        user_id: user.id,
        source_key: sourceKey,
        title: outfit.title,
        occasion,
        weather: weather as unknown as Json,
        outfit: { ...outfit, items: snapshotItems } as unknown as Json,
      },
      { onConflict: "user_id,source_key", ignoreDuplicates: true },
    );
    if (result.error) {
      return { status: "error", message: "整套收藏暂时失败。" };
    }
  } else {
    const result = await supabase
      .from("outfit_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("source_key", sourceKey);
    if (result.error) {
      return { status: "error", message: "取消收藏暂时失败。" };
    }
  }

  for (const style of outfit.styleTags) {
    await addFeedbackEvent(supabase, {
      userId: user.id,
      eventKey: `${intent}-outfit:${sourceKey}:${style}:${crypto.randomUUID()}`,
      eventType: intent === "add" ? "favorite_outfit" : "unfavorite_outfit",
      style,
      weight:
        intent === "add"
          ? FEEDBACK_WEIGHTS.favoriteOutfit
          : -FEEDBACK_WEIGHTS.favoriteOutfit,
      recommendationId,
      outfitSlot: slotValue,
    });
  }
  await recalculatePreferenceScores(supabase, user.id);
  revalidatePath("/recommendations");
  revalidatePath("/favorites");
  return {
    status: "success",
    message: intent === "add" ? "已收藏整套穿搭。" : "已取消整套收藏。",
    isFavorite: intent === "add",
  };
}
