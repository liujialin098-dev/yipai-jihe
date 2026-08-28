"use server";

import { revalidatePath } from "next/cache";
import {
  dateInTimeZone,
  isIsoDate,
  parseDiaryItemIds,
  parseDiaryOccasion,
  parseDiaryText,
  type DiaryActionState,
} from "@/lib/diary/validation";
import {
  allowedWardrobeAudiences,
  isClothingPreference,
  type ClothingPreference,
} from "@/lib/personalization/constants";
import { getActiveRecommendationItems } from "@/lib/recommendations/data";
import {
  parseRecommendationOccasion,
  validateRecommendationOutput,
  validateWeatherSnapshot,
} from "@/lib/recommendations/validation";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/wardrobe/validation";

type SnapshotSourceItem = {
  category: string;
  id: string;
  name: string;
  primary_color: string;
  style: string;
};

function diarySnapshot(items: SnapshotSourceItem[]) {
  return {
    items: items.map((item) => ({
      category: item.category,
      id: item.id,
      name: item.name,
      primaryColor: item.primary_color,
      style: item.style,
    })),
  } as unknown as Json;
}

function revalidateDiaryPaths() {
  revalidatePath("/");
  revalidatePath("/diary");
  revalidatePath("/diary/new");
  revalidatePath("/recommendations");
}

async function authenticatedDiaryContext() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) return { supabase, user: null, preference: null, timeZone: null };

  const { data: preferenceData, error: preferenceError } = await supabase
    .from("user_preferences")
    .select("clothing_preference, weather_timezone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (preferenceError || !preferenceData) {
    return { supabase, user, preference: null, timeZone: null };
  }

  const preference: ClothingPreference = isClothingPreference(
    preferenceData.clothing_preference,
  )
    ? preferenceData.clothing_preference
    : "unrestricted";
  return {
    supabase,
    user,
    preference,
    timeZone: preferenceData.weather_timezone ?? "Asia/Shanghai",
  };
}

export async function saveRecommendationToDiary(
  _previousState: DiaryActionState,
  formData: FormData,
): Promise<DiaryActionState> {
  const recommendationId = String(formData.get("recommendationId") ?? "");
  const slot = Number(formData.get("slot"));
  if (!isUuid(recommendationId) || ![1, 2, 3].includes(slot)) {
    return { status: "error", message: "这套推荐已变化，请刷新后重试。" };
  }

  const { supabase, user, preference, timeZone } =
    await authenticatedDiaryContext();
  if (!user)
    return { status: "error", message: "当前登录已失效，请重新进入应用。" };
  if (!preference || !timeZone) {
    return { status: "error", message: "账号偏好暂时无法读取，请稍后重试。" };
  }

  const recommendationResult = await supabase
    .from("daily_recommendations")
    .select("id, recommendation_date, occasion, weather, outfits")
    .eq("id", recommendationId)
    .eq("user_id", user.id)
    .maybeSingle();
  const row = recommendationResult.data;
  if (!row) {
    return { status: "error", message: "这套推荐已变化，请刷新后重试。" };
  }

  const today = dateInTimeZone(new Date(), timeZone);
  if (row.recommendation_date > today) {
    return {
      status: "error",
      message: "穿过以后再记录，明日计划暂不计入利用率。",
    };
  }

  const occasion = parseRecommendationOccasion(row.occasion);
  const weather = validateWeatherSnapshot(row.weather);
  const items = await getActiveRecommendationItems(
    supabase,
    user.id,
    preference,
  );
  const outfits =
    occasion && weather && items
      ? validateRecommendationOutput(
          { outfits: row.outfits },
          items,
          occasion,
          weather,
        )
      : null;
  const outfit = outfits?.find((candidate) => candidate.slot === slot);
  if (!occasion || !outfit || !items) {
    return { status: "error", message: "这套推荐已变化，请刷新后重试。" };
  }

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const outfitItems = outfit.itemIds.flatMap((id) => {
    const item = itemMap.get(id);
    return item ? [item] : [];
  });
  if (outfitItems.length !== outfit.itemIds.length) {
    return { status: "error", message: "所选衣物已变化，请重新选择。" };
  }

  const result = await supabase.from("outfit_diary_entries").upsert(
    {
      user_id: user.id,
      worn_on: row.recommendation_date,
      title: outfit.title,
      occasion,
      source: "recommendation",
      source_recommendation_id: row.id,
      source_outfit_slot: slot,
      item_ids: outfit.itemIds,
      outfit_snapshot: diarySnapshot(outfitItems),
      note: "",
    },
    { onConflict: "user_id,worn_on" },
  );
  if (result.error) {
    return { status: "error", message: "穿搭暂时无法记入，请稍后重试。" };
  }

  revalidateDiaryPaths();
  return { status: "success", message: "已记为今日穿搭。" };
}

export async function saveManualDiaryEntry(
  _previousState: DiaryActionState,
  formData: FormData,
): Promise<DiaryActionState> {
  const wornOn = String(formData.get("wornOn") ?? "");
  const title = parseDiaryText(formData.get("title"), 40);
  const note = parseDiaryText(formData.get("note"), 160);
  const occasion = parseDiaryOccasion(String(formData.get("occasion") ?? ""));
  const itemIds = parseDiaryItemIds(formData.getAll("itemIds"));
  if (!title || note === null || !occasion || !itemIds) {
    return {
      status: "error",
      message: "请填写标题，并选择 1 至 8 件不重复的衣物。",
    };
  }

  const { supabase, user, preference, timeZone } =
    await authenticatedDiaryContext();
  if (!user)
    return { status: "error", message: "当前登录已失效，请重新进入应用。" };
  if (!preference || !timeZone) {
    return { status: "error", message: "账号偏好暂时无法读取，请稍后重试。" };
  }
  const today = dateInTimeZone(new Date(), timeZone);
  if (!isIsoDate(wornOn) || wornOn > today) {
    return {
      status: "error",
      message: "穿过以后再记录，未来日期暂不计入利用率。",
    };
  }

  const itemsResult = await supabase
    .from("wardrobe_items")
    .select("id, name, category, primary_color, style")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("audience", allowedWardrobeAudiences(preference))
    .in("id", itemIds);
  const items = itemsResult.data ?? [];
  if (itemsResult.error || items.length !== itemIds.length) {
    return { status: "error", message: "所选衣物已变化，请重新选择。" };
  }
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const orderedItems = itemIds.flatMap((id) => {
    const item = itemMap.get(id);
    return item ? [item] : [];
  });

  const result = await supabase.from("outfit_diary_entries").upsert(
    {
      user_id: user.id,
      worn_on: wornOn,
      title,
      occasion,
      source: "manual",
      source_recommendation_id: null,
      source_outfit_slot: null,
      item_ids: itemIds,
      outfit_snapshot: diarySnapshot(orderedItems),
      note: note ?? "",
    },
    { onConflict: "user_id,worn_on" },
  );
  if (result.error) {
    return { status: "error", message: "这天的穿搭暂时无法保存。" };
  }

  revalidateDiaryPaths();
  return { status: "success", message: "这天的穿搭已保存。" };
}

export async function deleteDiaryEntry(
  _previousState: DiaryActionState,
  formData: FormData,
): Promise<DiaryActionState> {
  const entryId = String(formData.get("entryId") ?? "");
  if (!isUuid(entryId)) {
    return { status: "error", message: "这条记录已变化，请刷新后重试。" };
  }

  const { supabase, user } = await authenticatedDiaryContext();
  if (!user)
    return { status: "error", message: "当前登录已失效，请重新进入应用。" };
  const result = await supabase
    .from("outfit_diary_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (result.error) {
    return { status: "error", message: "这条记录暂时无法删除。" };
  }

  revalidateDiaryPaths();
  return { status: "success", message: "这条穿搭记录已删除。" };
}
