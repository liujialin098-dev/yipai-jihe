import type {
  Category,
  Material,
  Occasion,
  Season,
  WardrobeColor,
  WardrobeStyle,
} from "@/lib/wardrobe/constants";

export const RECOMMENDATION_OCCASIONS = [
  { value: "commute", label: "通勤" },
  { value: "casual", label: "休闲" },
  { value: "date", label: "约会" },
  { value: "formal", label: "正式" },
] as const;

export const WEATHER_PRESETS = [
  { value: "live", label: "实时天气" },
  { value: "mild", label: "温和测试" },
  { value: "hot", label: "热天测试" },
  { value: "cold", label: "冷天测试" },
  { value: "rainy", label: "雨天测试" },
] as const;

export type RecommendationOccasion =
  (typeof RECOMMENDATION_OCCASIONS)[number]["value"];
export type WeatherPreset = (typeof WEATHER_PRESETS)[number]["value"];
export type RecommendationSource = "ai" | "rules";

export type WeatherSnapshot = {
  city: string;
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  summary: string;
  source: "live" | "simulated";
  observedAt: string;
  preset: WeatherPreset;
};

export type RecommendationWardrobeItem = {
  id: string;
  name: string;
  category: Category;
  primary_color: WardrobeColor;
  material: Material;
  style: WardrobeStyle;
  seasons: Season[];
  occasions: Occasion[];
  status: string;
};

export type RecommendationOutfit = {
  slot: 1 | 2 | 3;
  title: string;
  reason: string;
  styleTags: WardrobeStyle[];
  itemIds: string[];
};

export type RecommendationActionState = {
  status: "idle" | "success" | "error";
  message: string;
  source?: RecommendationSource;
};

export const INITIAL_RECOMMENDATION_ACTION_STATE: RecommendationActionState = {
  status: "idle",
  message: "",
};

export const RECOMMENDATION_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    outfits: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slot: { type: "integer", enum: [1, 2, 3] },
          title: { type: "string", minLength: 1, maxLength: 30 },
          reason: { type: "string", minLength: 1, maxLength: 140 },
          styleTags: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: {
              type: "string",
              enum: [
                "minimal",
                "casual",
                "commute",
                "elegant",
                "sporty",
                "vintage",
              ],
            },
          },
          itemIds: {
            type: "array",
            minItems: 2,
            maxItems: 5,
            items: { type: "string" },
          },
        },
        required: ["slot", "title", "reason", "styleTags", "itemIds"],
      },
    },
  },
  required: ["outfits"],
} as const;

export function isRecommendationOccasion(
  value: string,
): value is RecommendationOccasion {
  return RECOMMENDATION_OCCASIONS.some((option) => option.value === value);
}

export function isWeatherPreset(value: string): value is WeatherPreset {
  return WEATHER_PRESETS.some((option) => option.value === value);
}

export function recommendationOccasionLabel(value: RecommendationOccasion) {
  return (
    RECOMMENDATION_OCCASIONS.find((option) => option.value === value)?.label ??
    value
  );
}
