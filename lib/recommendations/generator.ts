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
import { validateRecommendationOutput } from "@/lib/recommendations/validation";

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
  const prompt = `你是衣橱穿搭顾问。请只使用给定衣物 ID，为${recommendationOccasionLabel(input.occasion)}生成恰好 3 套完整穿搭。
每套必须包含连衣裙，或同时包含上装与下装；每套必须包含鞋。体感 8°C 以下必须加外套。
三套之间不能重复任何衣物 ID。至少有一件衣物明确适合所选场合和当前季节。
理由使用简洁中文，说明天气、场合、颜色或材质逻辑。不要推荐清单之外的商品。

天气：${JSON.stringify(input.weather)}
偏好风格：${JSON.stringify(input.preferredStyles)}
偏好场合：${JSON.stringify(input.preferredOccasions)}
衣着偏好：${input.clothingPreference}
衣物清单：${JSON.stringify(
    input.items.slice(0, 80).map((item) => ({
      id: item.id,
      audience: item.audience,
      name: item.name,
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
