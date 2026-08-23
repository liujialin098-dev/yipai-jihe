import { getViewer } from "@/lib/auth/viewer";
import type {
  RecommendationOccasion,
  RecommendationOutfit,
  RecommendationSource,
  RecommendationWardrobeItem,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import {
  parseRecommendationOccasion,
  validateRecommendationOutput,
  validateWeatherSnapshot,
} from "@/lib/recommendations/validation";
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
  "id, name, category, primary_color, material, style, seasons, occasions, status";
const DEFAULT_TIMEZONE = "Asia/Shanghai";

type RecommendationItemRow = Pick<
  Tables<"wardrobe_items">,
  | "id"
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
  timeZone = process.env.WEATHER_TIMEZONE?.trim() || DEFAULT_TIMEZONE,
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
  return `${value.year}-${value.month}-${value.day}`;
}

export async function getActiveRecommendationItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("wardrobe_items")
    .select(RECOMMENDATION_ITEM_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "active")
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
};

export async function getRecommendationPageData(): Promise<RecommendationPageData> {
  const viewer = await getViewer();
  if (!viewer) {
    return {
      viewerId: null,
      items: [],
      recommendation: null,
      itemFavoriteIds: [],
      outfitFavoriteKeys: [],
      error: "体验会话正在准备，请稍后刷新。",
    };
  }

  const supabase = await createClient();
  const date = recommendationDate();
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

    if (occasion && weather && outfits && source) {
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
      ? "今日推荐暂时无法读取，可以重新生成。"
      : null,
  };
}
