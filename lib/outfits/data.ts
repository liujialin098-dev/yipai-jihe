import {
  createInitialCanvasItems,
  type OutfitCanvasItem,
  type OutfitCanvasTheme,
  isOutfitCanvasTheme,
} from "@/lib/outfits/canvas";
import { parseCanvasItems } from "@/lib/outfits/validation";
import { getViewer } from "@/lib/auth/viewer";
import { getActiveRecommendationItems } from "@/lib/recommendations/data";
import {
  parseRecommendationOccasion,
  validateRecommendationOutput,
  validateWeatherSnapshot,
} from "@/lib/recommendations/validation";
import { createClient } from "@/lib/supabase/server";
import { getWardrobeItemsByIds, type WardrobeItem } from "@/lib/wardrobe/data";

export type OutfitCanvasWardrobeItem = Pick<
  WardrobeItem,
  "category" | "cutoutUrl" | "id" | "imageUrl" | "name"
>;

export type OutfitCanvasEditorData = {
  backgroundTheme: OutfitCanvasTheme;
  canvasId?: string;
  items: OutfitCanvasItem[];
  sourceRecommendationId?: string;
  sourceSlot?: 1 | 2 | 3;
  title: string;
  wardrobeItems: OutfitCanvasWardrobeItem[];
};

function toEditorWardrobeItems(items: WardrobeItem[]) {
  return items.map(({ category, cutoutUrl, id, imageUrl, name }) => ({
    category,
    cutoutUrl,
    id,
    imageUrl,
    name,
  }));
}

export async function getNewOutfitCanvasData(
  recommendationId: string,
  slot: number,
): Promise<OutfitCanvasEditorData | null> {
  if (![1, 2, 3].includes(slot)) return null;
  const viewer = await getViewer();
  if (!viewer) return null;

  const supabase = await createClient();
  const [recommendationResult, recommendationItems] = await Promise.all([
    supabase
      .from("daily_recommendations")
      .select("id, occasion, weather, outfits")
      .eq("id", recommendationId)
      .eq("user_id", viewer.userId)
      .maybeSingle(),
    getActiveRecommendationItems(
      supabase,
      viewer.userId,
      viewer.clothingPreference === "male" ||
        viewer.clothingPreference === "female"
        ? viewer.clothingPreference
        : "unrestricted",
    ),
  ]);

  const row = recommendationResult.data;
  const occasion = row ? parseRecommendationOccasion(row.occasion) : null;
  const weather = row ? validateWeatherSnapshot(row.weather) : null;
  if (!row || !occasion || !weather || !recommendationItems) return null;

  const outfits = validateRecommendationOutput(
    { outfits: row.outfits },
    recommendationItems,
    occasion,
    weather,
  );
  const outfit = outfits?.find((entry) => entry.slot === slot);
  if (!outfit) return null;

  const wardrobeItems = await getWardrobeItemsByIds(outfit.itemIds);
  const ownedIds = new Set(wardrobeItems.map((item) => item.id));
  const orderedIds = outfit.itemIds
    .filter((id) => ownedIds.has(id))
    .slice(0, 8);
  if (orderedIds.length < 2) return null;
  const itemById = new Map(wardrobeItems.map((item) => [item.id, item]));

  return {
    title: outfit.title,
    backgroundTheme: "lime",
    items: createInitialCanvasItems(
      orderedIds,
      new Map(wardrobeItems.map((item) => [item.id, item.category])),
    ),
    sourceRecommendationId: row.id,
    sourceSlot: slot as 1 | 2 | 3,
    wardrobeItems: toEditorWardrobeItems(
      orderedIds.flatMap((id) => {
        const item = itemById.get(id);
        return item ? [item] : [];
      }),
    ),
  };
}

export async function getSavedOutfitCanvasData(
  canvasId: string,
): Promise<OutfitCanvasEditorData | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_canvases")
    .select(
      "id, title, background_theme, source_recommendation_id, source_slot, items",
    )
    .eq("id", canvasId)
    .eq("user_id", viewer.userId)
    .maybeSingle();
  if (error || !data) return null;

  const parsedItems = parseCanvasItems(data.items);
  if (!parsedItems) return null;
  const wardrobeItems = await getWardrobeItemsByIds(
    parsedItems.map((item) => item.wardrobeItemId),
  );
  const itemById = new Map(wardrobeItems.map((item) => [item.id, item]));
  const items = parsedItems.filter((item) => itemById.has(item.wardrobeItemId));
  if (items.length < 2) return null;

  return {
    canvasId: data.id,
    title: data.title,
    backgroundTheme: isOutfitCanvasTheme(data.background_theme)
      ? data.background_theme
      : "lime",
    items,
    ...(data.source_recommendation_id
      ? { sourceRecommendationId: data.source_recommendation_id }
      : {}),
    ...(data.source_slot === 1 ||
    data.source_slot === 2 ||
    data.source_slot === 3
      ? { sourceSlot: data.source_slot }
      : {}),
    wardrobeItems: toEditorWardrobeItems(
      items.flatMap((item) => {
        const wardrobeItem = itemById.get(item.wardrobeItemId);
        return wardrobeItem ? [wardrobeItem] : [];
      }),
    ),
  };
}
