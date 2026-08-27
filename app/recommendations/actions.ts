"use server";

import { revalidatePath } from "next/cache";
import {
  addFeedbackEvent,
  FEEDBACK_WEIGHTS,
  recalculatePreferenceScores,
} from "@/lib/feedback/preferences";
import { replaceRecommendationItem } from "@/lib/feedback/replacement";
import {
  isClothingPreference,
  type ClothingPreference,
} from "@/lib/personalization/constants";
import {
  isRecommendationOccasion,
  isRecommendationTargetDay,
  type RecommendationActionState,
  type RecommendationOutfit,
  recommendationTargetDayLabel,
} from "@/lib/recommendations/constants";
import {
  getActiveRecommendationItems,
  recommendationDate,
} from "@/lib/recommendations/data";
import { generateAiRecommendations } from "@/lib/recommendations/generator";
import {
  LocationResolutionError,
  resolveChineseCity,
  storedWeatherLocation,
} from "@/lib/recommendations/location";
import {
  buildRuleRecommendations,
  InsufficientWardrobeError,
} from "@/lib/recommendations/rules";
import {
  getWeatherSnapshot,
  RealWeatherUnavailableError,
} from "@/lib/recommendations/weather";
import {
  parseRecommendationOccasion,
  validateRecommendationOutput,
  validateWeatherSnapshot,
} from "@/lib/recommendations/validation";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type WeatherCityActionState = {
  status: "idle" | "success" | "error";
  message: string;
  city?: string;
  admin1?: string;
};

export async function saveWeatherCity(
  _previousState: WeatherCityActionState,
  formData: FormData,
): Promise<WeatherCityActionState> {
  const cityInput = String(formData.get("city") ?? "").trim();
  if (cityInput.length < 2 || cityInput.length > 40) {
    return { status: "error", message: "请输入完整城市名，例如上海。" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) {
    return { status: "error", message: "当前登录已失效，请重新进入应用。" };
  }

  let location: Awaited<ReturnType<typeof resolveChineseCity>>;
  try {
    location = await resolveChineseCity(cityInput);
  } catch (error) {
    if (error instanceof LocationResolutionError) {
      if (error.code === "invalid") {
        return { status: "error", message: "请输入完整城市名，例如上海。" };
      }
      if (error.code === "not_found") {
        return {
          status: "error",
          message: "没有找到这个中国城市，请检查名称后重试。",
        };
      }
    }
    return { status: "error", message: "城市暂时无法确认，请稍后重试。" };
  }

  const clearResult = await supabase
    .from("daily_recommendations")
    .delete()
    .eq("user_id", user.id);
  if (clearResult.error) {
    return { status: "error", message: "天气城市暂时无法保存。" };
  }

  const preferenceResult = await supabase
    .from("user_preferences")
    .update({
      weather_city: location.city,
      weather_admin1: location.admin1,
      weather_latitude: location.latitude,
      weather_longitude: location.longitude,
      weather_timezone: location.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (preferenceResult.error || !preferenceResult.data) {
    return { status: "error", message: "天气城市暂时无法保存。" };
  }

  revalidatePath("/recommendations");
  revalidatePath("/settings");
  revalidatePath("/settings/preferences");
  return {
    status: "success",
    message: `天气城市已切换为${location.city}，请重新生成搭配。`,
    city: location.city,
    admin1: location.admin1,
  };
}

export async function generateDailyRecommendations(
  _previousState: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const occasionValue = String(formData.get("occasion") ?? "");
  const targetDayValue = String(formData.get("targetDay") ?? "");
  if (
    !isRecommendationOccasion(occasionValue) ||
    !isRecommendationTargetDay(targetDayValue)
  ) {
    return {
      status: "error",
      message: "请选择有效的日期和场合后再生成。",
    };
  }

  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user) {
      return {
        status: "error",
        message: "当前体验会话已失效，请刷新后重试。",
      };
    }

    const preferencesResult = await supabase
      .from("user_preferences")
      .select(
        "preferred_styles, preferred_occasions, clothing_preference, weather_city, weather_admin1, weather_latitude, weather_longitude, weather_timezone",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (preferencesResult.error || !preferencesResult.data) {
      return {
        status: "error",
        message: "衣橱或偏好暂时无法读取，请稍后重试。",
      };
    }

    const clothingPreference: ClothingPreference = isClothingPreference(
      preferencesResult.data.clothing_preference,
    )
      ? preferencesResult.data.clothing_preference
      : "unrestricted";
    const location = storedWeatherLocation(preferencesResult.data);
    if (!location) {
      return {
        status: "error",
        message: "请先在个人偏好中设置常用城市，再生成真实天气搭配。",
      };
    }

    const requestedAt = new Date();
    let items: Awaited<ReturnType<typeof getActiveRecommendationItems>>;
    let weather: Awaited<ReturnType<typeof getWeatherSnapshot>>;
    try {
      [items, weather] = await Promise.all([
        getActiveRecommendationItems(supabase, user.id, clothingPreference),
        getWeatherSnapshot(targetDayValue, location, requestedAt),
      ]);
    } catch (error) {
      if (error instanceof RealWeatherUnavailableError) {
        return {
          status: "error",
          message: "真实天气暂时无法获取，请稍后重试。本次不会使用模拟天气。",
        };
      }
      throw error;
    }
    if (!items) {
      return {
        status: "error",
        message: "衣橱暂时无法读取，请稍后重试。",
      };
    }

    let ruleOutfits: RecommendationOutfit[];
    try {
      ruleOutfits = buildRuleRecommendations({
        items,
        occasion: occasionValue,
        weather,
        preferredStyles: preferencesResult.data.preferred_styles,
      });
    } catch (error) {
      if (error instanceof InsufficientWardrobeError) {
        return {
          status: "error",
          message:
            "当前衣着偏好下还缺少能组成 3 套完整穿搭的衣物，请补充上装、下装、外套或鞋。",
        };
      }
      throw error;
    }

    let outfits = ruleOutfits;
    let source: "ai" | "rules" = "rules";
    let aiModel: string | null = null;
    try {
      const aiResult = await generateAiRecommendations({
        items,
        occasion: occasionValue,
        weather,
        preferredStyles: preferencesResult.data.preferred_styles,
        preferredOccasions: preferencesResult.data.preferred_occasions,
        clothingPreference,
      });
      outfits = aiResult.outfits;
      source = "ai";
      aiModel = aiResult.model;
    } catch {
      source = "rules";
      aiModel = null;
    }

    const generationMs = Math.min(Date.now() - startedAt, 15_000);
    const { error: saveError } = await supabase
      .from("daily_recommendations")
      .upsert(
        {
          user_id: user.id,
          recommendation_date: recommendationDate(
            requestedAt,
            location.timezone,
            targetDayValue,
          ),
          occasion: occasionValue,
          weather: weather as unknown as Json,
          outfits: outfits as unknown as Json,
          source,
          ai_model: aiModel,
          generation_ms: generationMs,
        },
        { onConflict: "user_id,recommendation_date" },
      );

    if (saveError) {
      return {
        status: "error",
        message: `方案已经生成，但${recommendationTargetDayLabel(targetDayValue)}记录暂时无法保存，请稍后重试。`,
      };
    }

    revalidatePath("/recommendations");
    return {
      status: "success",
      source,
      message:
        source === "ai"
          ? `${recommendationTargetDayLabel(targetDayValue)} 3 套 AI 穿搭已更新。`
          : `AI 暂时不可用，已按真实${recommendationTargetDayLabel(targetDayValue)}天气用稳定规则生成 3 套方案。`,
    };
  } catch {
    return {
      status: "error",
      message: "推荐暂时无法完成，请稍后再试。",
    };
  }
}

export async function replaceDailyRecommendationItem(
  _previousState: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const recommendationId = String(formData.get("recommendationId") ?? "");
  const currentItemId = String(formData.get("currentItemId") ?? "");
  const replacementItemId = String(formData.get("replacementItemId") ?? "");
  const slotValue = Number(formData.get("slot"));
  if (![1, 2, 3].includes(slotValue)) {
    return { status: "error", message: "替换位置无效。" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { status: "error", message: "体验会话已失效，请刷新后重试。" };
  }

  const [recommendationResult, items] = await Promise.all([
    supabase
      .from("daily_recommendations")
      .select("occasion, weather, outfits")
      .eq("id", recommendationId)
      .eq("user_id", user.id)
      .maybeSingle(),
    getActiveRecommendationItems(supabase, user.id),
  ]);
  const row = recommendationResult.data;
  const occasion = row ? parseRecommendationOccasion(row.occasion) : null;
  const weather = row ? validateWeatherSnapshot(row.weather) : null;
  const currentOutfits =
    row && occasion && weather && items
      ? validateRecommendationOutput(
          { outfits: row.outfits },
          items,
          occasion,
          weather,
        )
      : null;
  if (!row || !occasion || !weather || !items || !currentOutfits) {
    return { status: "error", message: "当前方案已变化，请刷新后再试。" };
  }

  const nextOutfits = replaceRecommendationItem({
    outfits: currentOutfits,
    currentItemId,
    replacementItemId,
    slot: slotValue as 1 | 2 | 3,
    items,
    occasion,
    weather,
  });
  const replacement = items.find((item) => item.id === replacementItemId);
  if (!nextOutfits || !replacement) {
    return { status: "error", message: "这件候选不再适合当前方案。" };
  }

  const updateResult = await supabase
    .from("daily_recommendations")
    .update({ outfits: nextOutfits as unknown as Json })
    .eq("id", recommendationId)
    .eq("user_id", user.id);
  if (updateResult.error) {
    return { status: "error", message: "替换暂时无法保存。" };
  }

  await addFeedbackEvent(supabase, {
    userId: user.id,
    eventKey: `replace:${recommendationId}:${slotValue}:${crypto.randomUUID()}`,
    eventType: "replace",
    style: replacement.style,
    weight: FEEDBACK_WEIGHTS.replacement,
    recommendationId,
    outfitSlot: slotValue,
    wardrobeItemId: replacementItemId,
    metadata: { currentItemId, replacementItemId },
  });
  await recalculatePreferenceScores(supabase, user.id);
  revalidatePath("/recommendations");
  return { status: "success", message: `已换成${replacement.name}。` };
}

export async function recordRecommendationView(
  recommendationId: string,
  version: string,
) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) return;
  const result = await supabase
    .from("daily_recommendations")
    .select("id, updated_at")
    .eq("id", recommendationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!result.data || result.data.updated_at !== version) return;
  await addFeedbackEvent(supabase, {
    userId: user.id,
    eventKey: `view:${recommendationId}:${version}`,
    eventType: "view",
    recommendationId,
    metadata: { version },
  });
}
