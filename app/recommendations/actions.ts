"use server";

import { revalidatePath } from "next/cache";
import {
  isRecommendationOccasion,
  isWeatherPreset,
  type RecommendationActionState,
  type RecommendationOutfit,
} from "@/lib/recommendations/constants";
import {
  getActiveRecommendationItems,
  recommendationDate,
} from "@/lib/recommendations/data";
import { generateAiRecommendations } from "@/lib/recommendations/generator";
import {
  buildRuleRecommendations,
  InsufficientWardrobeError,
} from "@/lib/recommendations/rules";
import { getWeatherSnapshot } from "@/lib/recommendations/weather";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export async function generateDailyRecommendations(
  _previousState: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const occasionValue = String(formData.get("occasion") ?? "");
  const presetValue = String(formData.get("weatherPreset") ?? "");
  if (
    !isRecommendationOccasion(occasionValue) ||
    !isWeatherPreset(presetValue)
  ) {
    return {
      status: "error",
      message: "请选择有效的场合和天气后再生成。",
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

    const [items, preferencesResult, weather] = await Promise.all([
      getActiveRecommendationItems(supabase, user.id),
      supabase
        .from("user_preferences")
        .select("preferred_styles, preferred_occasions")
        .eq("user_id", user.id)
        .maybeSingle(),
      getWeatherSnapshot(presetValue),
    ]);

    if (!items || preferencesResult.error || !preferencesResult.data) {
      return {
        status: "error",
        message: "衣橱或偏好暂时无法读取，请稍后重试。",
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
            "还缺少能组成 3 套完整穿搭的衣物，请先补充上装、下装、连衣裙、外套或鞋。",
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
          recommendation_date: recommendationDate(),
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
        message: "方案已经生成，但今日记录暂时无法保存，请稍后重试。",
      };
    }

    revalidatePath("/recommendations");
    return {
      status: "success",
      source,
      message:
        source === "ai"
          ? "今日 3 套 AI 穿搭已更新。"
          : "AI 暂时不可用，已用稳定搭配规则生成 3 套方案。",
    };
  } catch {
    return {
      status: "error",
      message: "推荐暂时无法完成，请稍后再试。",
    };
  }
}
