"use server";
import { locationKey } from "@/lib/weather/parse";

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
  RecommendationGenerationError,
  recommendationFailureMessage,
  type RecommendationFailureCode,
} from "@/lib/recommendations/qwen";
import {
  LocationResolutionError,
  resolveChineseCity,
  storedWeatherLocation,
} from "@/lib/recommendations/location";
import {
  clearWeatherLocationOverride,
  getEffectiveWeatherLocation,
  setWeatherLocationOverride,
} from "@/lib/recommendations/location-context";
import {
  buildRuleRecommendations,
  InsufficientWardrobeError,
} from "@/lib/recommendations/rules";
import {
  isRecommendationStyleFocus,
  resolveStyleDirections,
  styleSupportsOccasion,
} from "@/lib/recommendations/style-direction";
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
import { requestOpenAiImage } from "@/lib/openai/images";
import {
  buildLookbookPrompt,
  lookbookObjectPath,
  parseGeneratedImage,
} from "@/lib/recommendations/lookbook";
import { isUuid } from "@/lib/wardrobe/validation";

export type WeatherCityActionState = {
  status: "idle" | "success" | "error";
  message: string;
  city?: string;
  admin1?: string;
};

export type LookbookActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function revalidateWeatherCityPaths() {
  revalidatePath("/inspiration");
  revalidatePath("/recommendations");
  revalidatePath("/settings");
  revalidatePath("/settings/preferences");
}

type WeatherCityMode = "session" | "saved";

async function applyWeatherLocation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  location: Awaited<ReturnType<typeof resolveChineseCity>>,
  mode: WeatherCityMode,
  source: "manual" | "device",
): Promise<WeatherCityActionState> {
  const clearResult = await supabase
    .from("daily_recommendations")
    .delete()
    .eq("user_id", userId);
  if (clearResult.error) {
    return { status: "error", message: "天气城市暂时无法保存。" };
  }

  if (mode === "session") {
    try {
      await setWeatherLocationOverride(userId, location);
    } catch {
      return { status: "error", message: "本次天气城市暂时无法启用。" };
    }
    revalidateWeatherCityPaths();
    return {
      status: "success",
      message:
        source === "device"
          ? `已定位到${location.city}，本次天气将使用这里，常用城市没有改变。`
          : `本次天气已切换为${location.city}，账号常用城市没有改变。`,
      city: location.city,
      admin1: location.admin1,
    };
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
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();
  if (preferenceResult.error || !preferenceResult.data) {
    return { status: "error", message: "天气城市暂时无法保存。" };
  }

  await clearWeatherLocationOverride();
  revalidateWeatherCityPaths();
  return {
    status: "success",
    message:
      source === "device"
        ? `已把${location.city}设为常用城市，请重新生成搭配。`
        : `常用城市已切换为${location.city}，请重新生成搭配。`,
    city: location.city,
    admin1: location.admin1,
  };
}

export async function saveWeatherCity(
  _previousState: WeatherCityActionState,
  formData: FormData,
): Promise<WeatherCityActionState> {
  const cityInput = String(formData.get("city") ?? "").trim();
  const mode = formData.get("mode") === "session" ? "session" : "saved";
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

  return applyWeatherLocation(supabase, user.id, location, mode, "manual");
}

export async function saveDeviceWeatherLocation(
  _previousState: WeatherCityActionState,
  formData: FormData,
): Promise<WeatherCityActionState> {
  const modeValue = formData.get("mode");
  if (modeValue !== "session" && modeValue !== "saved") {
    return { status: "error", message: "请选择本次使用或设为常用城市。" };
  }
  const mode: WeatherCityMode = modeValue;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) {
    return { status: "error", message: "当前登录已失效，请重新进入应用。" };
  }

  const city = String(formData.get("city") ?? "").trim();
  if (city.length < 2 || city.length > 80) {
    return { status: "error", message: "定位城市无效，请重新定位。" };
  }

  let location: Awaited<ReturnType<typeof resolveChineseCity>>;
  try {
    location = await resolveChineseCity(city);
  } catch {
    return {
      status: "error",
      message: "定位城市暂时无法用于天气，请手动选择城市。",
    };
  }

  return applyWeatherLocation(supabase, user.id, location, mode, "device");
}

export async function restoreSavedWeatherCity(
  _previousState: WeatherCityActionState,
  _formData: FormData,
): Promise<WeatherCityActionState> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) {
    return { status: "error", message: "当前登录已失效，请重新进入应用。" };
  }

  const [preferenceResult, clearResult] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("weather_city")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("daily_recommendations").delete().eq("user_id", user.id),
  ]);
  if (preferenceResult.error || clearResult.error) {
    return { status: "error", message: "常用城市暂时无法恢复。" };
  }

  await clearWeatherLocationOverride();
  revalidateWeatherCityPaths();
  const city = preferenceResult.data?.weather_city ?? undefined;
  return {
    status: "success",
    message: city
      ? `已恢复常用城市${city}，请重新生成搭配。`
      : "本次城市已清除，请选择一个常用城市。",
    city,
  };
}

export async function generateDailyRecommendations(
  _previousState: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const occasionValue = String(formData.get("occasion") ?? "");
  const targetDayValue = String(formData.get("targetDay") ?? "");
  const styleFocusValue = String(formData.get("styleFocus") ?? "auto");
  if (
    !isRecommendationOccasion(occasionValue) ||
    !isRecommendationTargetDay(targetDayValue) ||
    !isRecommendationStyleFocus(styleFocusValue)
  ) {
    return {
      status: "error",
      message: "请选择有效的日期和场合后再生成。",
    };
  }
  if (
    styleFocusValue !== "auto" &&
    !styleSupportsOccasion(styleFocusValue, occasionValue)
  ) {
    return {
      status: "error",
      message: "这个风格与当前场景不够一致，请换一个方向。",
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
    const styleDirections = resolveStyleDirections({
      focus: styleFocusValue,
      occasion: occasionValue,
      preferredStyles: preferencesResult.data.preferred_styles,
    });
    const savedLocation = storedWeatherLocation(preferencesResult.data);
    const { effectiveLocation: location } = await getEffectiveWeatherLocation(
      user.id,
      savedLocation,
    );
    if (!location) {
      return {
        status: "error",
        message: "请先在个人偏好中设置常用城市，再生成真实天气搭配。",
      };
    }

    const requestedAt = new Date();
    const expectedWeatherLocation = String(
      formData.get("expectedWeatherLocation") ?? "",
    );
    const expectedWeatherDate = String(
      formData.get("expectedWeatherDate") ?? "",
    );
    if (
      expectedWeatherLocation !== locationKey(location) ||
      expectedWeatherDate !==
        recommendationDate(requestedAt, location.timezone, targetDayValue)
    ) {
      return {
        status: "error",
        message: "城市或日期已变化，请刷新天气后再生成。",
      };
    }
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
        styleDirections,
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
    let failureCode: RecommendationFailureCode = "provider_error";
    try {
      const aiResult = await generateAiRecommendations({
        items,
        occasion: occasionValue,
        weather,
        preferredStyles: preferencesResult.data.preferred_styles,
        preferredOccasions: preferencesResult.data.preferred_occasions,
        clothingPreference,
        styleDirections,
      });
      outfits = aiResult.outfits;
      source = "ai";
      aiModel = aiResult.model;
    } catch (error) {
      failureCode =
        error instanceof RecommendationGenerationError
          ? error.code
          : "provider_error";
      source = "rules";
      aiModel = null;
    }

    const latestPreferences = await supabase
      .from("user_preferences")
      .select(
        "weather_city, weather_admin1, weather_latitude, weather_longitude, weather_timezone",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    const latestLocation = latestPreferences.data
      ? (
          await getEffectiveWeatherLocation(
            user.id,
            storedWeatherLocation(latestPreferences.data),
          )
        ).effectiveLocation
      : null;
    if (
      latestPreferences.error ||
      !latestLocation ||
      locationKey(latestLocation) !== expectedWeatherLocation ||
      recommendationDate(
        new Date(),
        latestLocation.timezone,
        targetDayValue,
      ) !== expectedWeatherDate
    ) {
      return {
        status: "error",
        message: "生成期间城市或日期已变化，请刷新后重新生成。",
      };
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
          : `${recommendationFailureMessage(failureCode)}，已按真实${recommendationTargetDayLabel(targetDayValue)}天气用规则生成 3 套方案。`,
    };
  } catch {
    return {
      status: "error",
      message: "推荐暂时无法完成，请稍后再试。",
    };
  }
}

export async function generateRecommendationLookbook(
  _previousState: LookbookActionState,
  formData: FormData,
): Promise<LookbookActionState> {
  const recommendationId = String(formData.get("recommendationId") ?? "");
  const slotValue = Number(formData.get("slot"));
  if (!isUuid(recommendationId) || ![1, 2, 3].includes(slotValue)) {
    return {
      status: "error",
      message: "这套搭配已经变化，请刷新后重试。",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      status: "error",
      message: "虚拟模特效果图暂未配置，真实衣物搭配仍可正常使用。",
    };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) {
    return {
      status: "error",
      message: "当前登录已失效，请重新进入应用。",
    };
  }

  const [recommendationResult, preferenceResult, items] = await Promise.all([
    supabase
      .from("daily_recommendations")
      .select("id, occasion, weather, outfits")
      .eq("id", recommendationId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_preferences")
      .select("clothing_preference")
      .eq("user_id", user.id)
      .maybeSingle(),
    getActiveRecommendationItems(supabase, user.id),
  ]);
  const row = recommendationResult.data;
  const occasion = row ? parseRecommendationOccasion(row.occasion) : null;
  const weather = row ? validateWeatherSnapshot(row.weather) : null;
  const preferenceValue = preferenceResult.data?.clothing_preference;
  const clothingPreference: ClothingPreference =
    typeof preferenceValue === "string" && isClothingPreference(preferenceValue)
      ? preferenceValue
      : "unrestricted";
  const outfits =
    row && occasion && weather && items
      ? validateRecommendationOutput(
          { outfits: row.outfits },
          items,
          occasion,
          weather,
        )
      : null;
  const slot = slotValue as 1 | 2 | 3;
  const outfit = outfits?.find((candidate) => candidate.slot === slot);
  if (
    recommendationResult.error ||
    preferenceResult.error ||
    !row ||
    !occasion ||
    !weather ||
    !items ||
    !outfits ||
    !outfit
  ) {
    return {
      status: "error",
      message: "这套搭配已经变化，请刷新后重试。",
    };
  }

  const model = process.env.OPENAI_LOOKBOOK_MODEL?.trim() || "gpt-image-2";
  let image: Buffer;
  try {
    const response = await requestOpenAiImage({
      apiKey,
      body: JSON.stringify({
        model,
        prompt: buildLookbookPrompt({
          clothingPreference,
          items,
          occasion,
          outfit,
          weather,
        }),
        quality: "medium",
        size: "1024x1536",
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) {
      if (response.status === 429) {
        return {
          status: "error",
          message: "效果图请求较多，请稍后重试。",
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          status: "error",
          message: "虚拟模特效果图暂未配置，真实衣物搭配仍可正常使用。",
        };
      }
      return {
        status: "error",
        message: "效果图暂时无法生成，请稍后重试。",
      };
    }

    const payload: unknown = await response.json();
    const parsed = parseGeneratedImage(payload);
    if (!parsed) {
      return {
        status: "error",
        message: "效果图暂时无法生成，请稍后重试。",
      };
    }
    image = parsed;
  } catch {
    return {
      status: "error",
      message: "效果图暂时无法生成，请稍后重试。",
    };
  }

  const path = lookbookObjectPath(user.id, recommendationId, slot);
  const uploadResult = await supabase.storage
    .from("wardrobe-images")
    .upload(path, image, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: true,
    });
  if (uploadResult.error) {
    return {
      status: "error",
      message: "效果图已经生成，但暂时无法保存，请重试。",
    };
  }

  const generatedAt = new Date().toISOString();
  const nextOutfits = outfits.map((candidate) =>
    candidate.slot === slot
      ? {
          ...candidate,
          lookbookImagePath: path,
          lookbookModel: model,
          lookbookGeneratedAt: generatedAt,
        }
      : candidate,
  );
  const updateResult = await supabase
    .from("daily_recommendations")
    .update({ outfits: nextOutfits as unknown as Json })
    .eq("id", recommendationId)
    .eq("user_id", user.id);
  if (updateResult.error) {
    return {
      status: "error",
      message: "效果图已经生成，但暂时无法保存，请重试。",
    };
  }

  revalidatePath("/recommendations");
  return {
    status: "success",
    message: "虚拟模特效果图已生成，实际颜色与版型请以衣物实拍为准。",
  };
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
