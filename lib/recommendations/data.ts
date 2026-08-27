import { getViewer } from "@/lib/auth/viewer";
import {
  allowedWardrobeAudiences,
  type ClothingPreference,
} from "@/lib/personalization/constants";
import type {
  RecommendationOccasion,
  RecommendationOutfit,
  RecommendationSource,
  RecommendationTargetDay,
  RecommendationWardrobeItem,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import {
  parseRecommendationOccasion,
  validateRecommendationOutput,
  validateWeatherSnapshot,
} from "@/lib/recommendations/validation";
import { storedWeatherLocation } from "@/lib/recommendations/location";
import { getWeatherLocationContext } from "@/lib/recommendations/location-context";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Material,
  Occasion,
  Season,
  WardrobeColor,
  WardrobeStyle,
} from "@/lib/wardrobe/constants";
import { getWardrobeItems, type WardrobeItem } from "@/lib/wardrobe/data";

const RECOMMENDATION_ITEM_COLUMNS =
  "id, name, category, primary_color, material, style, seasons, occasions, audience, status";
const DEFAULT_TIMEZONE = "Asia/Shanghai";

type RecommendationItemRow = Pick<
  Tables<"wardrobe_items">,
  | "id"
  | "audience"
  | "name"
  | "category"
  | "primary_color"
  | "material"
  | "style"
  | "seasons"
  | "occasions"
  | "status"
>;

export function toRecommendationItem(
  item: RecommendationItemRow,
): RecommendationWardrobeItem {
  return {
    ...item,
    audience: item.audience as RecommendationWardrobeItem["audience"],
    category: item.category as Category,
    primary_color: item.primary_color as WardrobeColor,
    material: item.material as Material,
    style: item.style as WardrobeStyle,
    seasons: item.seasons as Season[],
    occasions: item.occasions as Occasion[],
  };
}

export function recommendationDate(
  date = new Date(),
  timeZone = DEFAULT_TIMEZONE,
  targetDay: RecommendationTargetDay = "today",
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const targetDate = new Date(
    Date.UTC(
      Number(value.year),
      Number(value.month) - 1,
      Number(value.day) + (targetDay === "tomorrow" ? 1 : 0),
    ),
  );
  return targetDate.toISOString().slice(0, 10);
}

export async function getActiveRecommendationItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  clothingPreference?: ClothingPreference,
) {
  let resolvedPreference = clothingPreference;
  if (!resolvedPreference) {
    const preferenceResult = await supabase
      .from("user_preferences")
      .select("clothing_preference")
      .eq("user_id", userId)
      .maybeSingle();
    resolvedPreference =
      preferenceResult.data?.clothing_preference === "male" ||
      preferenceResult.data?.clothing_preference === "female"
        ? preferenceResult.data.clothing_preference
        : "unrestricted";
  }
  const { data, error } = await supabase
    .from("wardrobe_items")
    .select(RECOMMENDATION_ITEM_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("audience", allowedWardrobeAudiences(resolvedPreference))
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !data) return null;
  return data.map(toRecommendationItem);
}

export type DailyRecommendationView = {
  id: string;
  recommendationDate: string;
  occasion: RecommendationOccasion;
  weather: WeatherSnapshot;
  outfits: RecommendationOutfit[];
  source: RecommendationSource;
  aiModel: string | null;
  generationMs: number;
  updatedAt: string;
};

export type RecommendationPageData = {
  viewerId: string | null;
  items: WardrobeItem[];
  recommendation: DailyRecommendationView | null;
  itemFavoriteIds: string[];
  outfitFavoriteKeys: string[];
  error: string | null;
  ipCitySuggestion: { city: string } | null;
  usingWeatherCityOverride: boolean;
  weatherCity: string | null;
  weatherSavedCity: string | null;
  targetDate: string;
};

export async function getRecommendationPageData(
  targetDay: RecommendationTargetDay = "today",
): Promise<RecommendationPageData> {
  const viewer = await getViewer();
  if (!viewer) {
    return {
      viewerId: null,
      items: [],
      recommendation: null,
      itemFavoriteIds: [],
      outfitFavoriteKeys: [],
      error: "体验会话正在准备，请稍后刷新。",
      ipCitySuggestion: null,
      usingWeatherCityOverride: false,
      weatherCity: null,
      weatherSavedCity: null,
      targetDate: recommendationDate(new Date(), DEFAULT_TIMEZONE, targetDay),
    };
  }

  const savedLocation = storedWeatherLocation({
    weather_admin1: viewer.weatherAdmin1,
    weather_city: viewer.weatherCity,
    weather_latitude: viewer.weatherLatitude,
    weather_longitude: viewer.weatherLongitude,
    weather_timezone: viewer.weatherTimezone,
  });
  const locationContext = await getWeatherLocationContext(
    viewer.userId,
    savedLocation,
  );
  const effectiveLocation = locationContext.effectiveLocation;
  const supabase = await createClient();
  const date = recommendationDate(
    new Date(),
    effectiveLocation?.timezone ?? DEFAULT_TIMEZONE,
    targetDay,
  );
  const [
    wardrobeResult,
    recommendationResult,
    itemFavoritesResult,
    outfitFavoritesResult,
  ] = await Promise.all([
    getWardrobeItems({ q: "", status: "active" }),
    supabase
      .from("daily_recommendations")
      .select(
        "id, recommendation_date, occasion, weather, outfits, source, ai_model, generation_ms, updated_at",
      )
      .eq("user_id", viewer.userId)
      .eq("recommendation_date", date)
      .maybeSingle(),
    supabase
      .from("wardrobe_item_favorites")
      .select("wardrobe_item_id")
      .eq("user_id", viewer.userId),
    supabase
      .from("outfit_favorites")
      .select("source_key")
      .eq("user_id", viewer.userId),
  ]);

  if (wardrobeResult.error) {
    return {
      viewerId: viewer.userId,
      items: [],
      recommendation: null,
      itemFavoriteIds: [],
      outfitFavoriteKeys: [],
      error: wardrobeResult.error,
      ipCitySuggestion: locationContext.ipSuggestion
        ? { city: locationContext.ipSuggestion.city }
        : null,
      usingWeatherCityOverride: locationContext.overrideActive,
      weatherCity: effectiveLocation?.city ?? null,
      weatherSavedCity: savedLocation?.city ?? null,
      targetDate: date,
    };
  }

  const recommendationItems = wardrobeResult.items.map((item) =>
    toRecommendationItem(item),
  );
  const row = recommendationResult.data;
  let recommendation: DailyRecommendationView | null = null;

  if (!recommendationResult.error && row) {
    const occasion = parseRecommendationOccasion(row.occasion);
    const weather = validateWeatherSnapshot(row.weather);
    const outfits =
      occasion && weather
        ? validateRecommendationOutput(
            { outfits: row.outfits },
            recommendationItems,
            occasion,
            weather,
          )
        : null;
    const source =
      row.source === "ai" || row.source === "rules" ? row.source : null;

    if (
      occasion &&
      weather?.source === "live" &&
      weather.city === effectiveLocation?.city &&
      outfits &&
      source
    ) {
      recommendation = {
        id: row.id,
        recommendationDate: row.recommendation_date,
        occasion,
        weather,
        outfits,
        source,
        aiModel: row.ai_model,
        generationMs: row.generation_ms,
        updatedAt: row.updated_at,
      };
    }
  }

  return {
    viewerId: viewer.userId,
    items: wardrobeResult.items,
    recommendation,
    itemFavoriteIds:
      itemFavoritesResult.data?.map((favorite) => favorite.wardrobe_item_id) ??
      [],
    outfitFavoriteKeys:
      outfitFavoritesResult.data?.map((favorite) => favorite.source_key) ?? [],
    error: recommendationResult.error
      ? `${targetDay === "tomorrow" ? "明日" : "今日"}推荐暂时无法读取，可以重新生成。`
      : row && validateWeatherSnapshot(row.weather)?.source === "simulated"
        ? "旧的模拟天气方案已停用，请使用真实天气重新生成。"
        : null,
    ipCitySuggestion: locationContext.ipSuggestion
      ? { city: locationContext.ipSuggestion.city }
      : null,
    usingWeatherCityOverride: locationContext.overrideActive,
    weatherCity: effectiveLocation?.city ?? null,
    weatherSavedCity: savedLocation?.city ?? null,
    targetDate: date,
  };
}
