import {
  RECOMMENDATION_OUTPUT_SCHEMA,
  recommendationOccasionLabel,
  type RecommendationOccasion,
  type RecommendationOutfit,
  type RecommendationWardrobeItem,
  type WeatherSnapshot,
} from "@/lib/recommendations/constants";
import type { ClothingPreference } from "@/lib/personalization/constants";
import { requestOpenAiResponse } from "@/lib/openai/responses";
import { getOccasionProfile } from "@/lib/recommendations/occasion-profile";
import {
  hasCompleteRainProtectionCandidate,
  isRainyWeatherCode,
} from "@/lib/recommendations/rain-protection";
import {
  seasonForTemperature,
  validateRecommendationOutput,
} from "@/lib/recommendations/validation";
import type { WardrobeStyle } from "@/lib/wardrobe/constants";

export type RecommendationFailureCode =
  | "not_configured"
  | "timeout"
  | "rate_limited"
  | "provider_error"
  | "invalid_result";

export class RecommendationGenerationError extends Error {
  constructor(public readonly code: RecommendationFailureCode) {
    super(code);
    this.name = "RecommendationGenerationError";
  }
}

type OpenAIResponse = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{ type?: unknown; text?: unknown }>;
  }>;
};

function outputText(response: OpenAIResponse) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

type GenerateInput = {
  clothingPreference: ClothingPreference;
  items: RecommendationWardrobeItem[];
  occasion: RecommendationOccasion;
  weather: WeatherSnapshot;
  preferredStyles: string[];
  preferredOccasions: string[];
  styleDirections: [WardrobeStyle, WardrobeStyle, WardrobeStyle];
};

export async function generateAiRecommendations(input: GenerateInput): Promise<{
  outfits: RecommendationOutfit[];
  model: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new RecommendationGenerationError("not_configured");

  const model =
    process.env.OPENAI_RECOMMENDATION_MODEL?.trim() ||
    process.env.OPENAI_VISION_MODEL?.trim() ||
    "gpt-4o-mini";
  const occasionProfile = getOccasionProfile(input.occasion);
  const requiresRainProtection =
    isRainyWeatherCode(input.weather.weatherCode) &&
    hasCompleteRainProtectionCandidate(
      input.items,
      input.occasion,
      seasonForTemperature(input.weather.apparentTemperatureC),
      input.weather.apparentTemperatureC,
    );
  const prompt = `你是衣橱穿搭顾问。请只使用给定衣物 ID，为${recommendationOccasionLabel(input.occasion)}生成恰好 3 套完整穿搭。
每套必须包含连衣裙，或同时包含上装与下装；每套必须包含鞋。每套使用 3～7 件衣物：最多 2 件上装、1 件外套、1 件下装或 1 件连衣裙、1 双鞋和 2 件配饰。
当使用 2 件上装时，itemIds 中先放更贴身轻薄的内搭，再放主上装。体感 18°C 以下且库存允许时，至少一套优先使用内搭 + 主上装；体感 8°C 以下每套必须加外套。体感 27°C 以上不要强行叠穿，也不要加入非夏季外套。
三套之间不能重复任何衣物 ID。每套至少要有两件不同衣物提供当前场景信号：衣物的 occasions 包含当前场景或场景允许的邻近场合，或 style 属于场景偏好风格。
场景边界是硬约束：若衣物没有当前场景标签，却带有场景画像 forbiddenForeignOccasions 中任一标签，不得使用。若衣物明确包含当前场景，即使同时包含其他场景，仍可使用。
不要只替换标题、理由或配饰来制造差异，三套的核心单品和搭配思路都要不同。
正式场景不得使用 occasions 只有 sport 的仅运动单品。约会场景不得强制使用裙装，要适配当前衣着偏好。
雨天完整防水组合要求：${requiresRainProtection ? "当前衣橱存在合法且季节适配的防水外层、冲锋裤/防水下装和防水鞋，3 套中至少 1 套必须同时使用这三个角色。" : "当前输入不要求强行补齐完整防水组合；不得虚构清单外单品。"}
第 1、2、3 套 styleTags 的第一个值必须依次为：${input.styleDirections.join("、")}。风格是软目标，不得为了风格突破场景、天气、归属、完整性或跨套不重复规则。
配饰用于完成比例与重点，不得为了凑数量加入与场景冲突的单品。reason 使用简洁中文说明天气、场合、颜色或材质逻辑；stylingPoint 给出一句 60 字内、用户可直接照做的层次、比例或配色动作。不要推荐清单之外的商品。

场景画像：${JSON.stringify({
    summary: occasionProfile.summary,
    preferredStyles: occasionProfile.preferredStyles,
    relatedOccasions: occasionProfile.relatedOccasions,
    discouragedStyles: occasionProfile.discouragedStyles,
    forbiddenForeignOccasions: occasionProfile.forbiddenForeignOccasions,
    selectionGuidance: occasionProfile.selectionGuidance,
  })}
天气：${JSON.stringify(input.weather)}
温度字段解释：${input.weather.temperatureBasis === "air_minimum" ? "这是明日预报，apparentTemperatureC 仅为历史兼容字段，实际代表最低气温，不是体感。描述必须写最低气温，并结合 temperatureMaxC 提醒白天增减；禁止编造体感温度。" : "apparentTemperatureC 为真实体感温度。"}
偏好风格：${JSON.stringify(input.preferredStyles)}
偏好场合：${JSON.stringify(input.preferredOccasions)}
衣着偏好：${input.clothingPreference}
衣物清单：${JSON.stringify(
    input.items.slice(0, 80).map((item) => ({
      id: item.id,
      audience: item.audience,
      name: item.name,
      brand: item.brand,
      category: item.category,
      color: item.primary_color,
      material: item.material,
      style: item.style,
      seasons: item.seasons,
      occasions: item.occasions,
    })),
  )}`;

  try {
    const response = await requestOpenAiResponse({
      apiKey,
      body: JSON.stringify({
        model,
        store: false,
        temperature: 0.2,
        max_output_tokens: 1_200,
        input: [
          { role: "user", content: [{ type: "input_text", text: prompt }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "daily_wardrobe_recommendations",
            strict: true,
            schema: RECOMMENDATION_OUTPUT_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new RecommendationGenerationError("rate_limited");
      }
      throw new RecommendationGenerationError("provider_error");
    }

    const payload = (await response.json()) as OpenAIResponse;
    const text = outputText(payload);
    if (!text) throw new RecommendationGenerationError("invalid_result");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new RecommendationGenerationError("invalid_result");
    }
    const outfits = validateRecommendationOutput(
      parsed,
      input.items,
      input.occasion,
      input.weather,
      input.styleDirections,
    );
    if (!outfits) throw new RecommendationGenerationError("invalid_result");
    return { outfits, model };
  } catch (error) {
    if (error instanceof RecommendationGenerationError) throw error;
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new RecommendationGenerationError("timeout");
    }
    throw new RecommendationGenerationError("provider_error");
  }
}
