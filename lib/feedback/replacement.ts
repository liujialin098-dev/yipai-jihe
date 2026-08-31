import type {
  RecommendationOccasion,
  RecommendationOutfit,
  RecommendationWardrobeItem,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import {
  seasonForTemperature,
  validateRecommendationOutput,
} from "@/lib/recommendations/validation";

export function replacementCandidates({
  items,
  outfits,
  currentItemId,
  occasion,
  weather,
}: {
  items: RecommendationWardrobeItem[];
  outfits: RecommendationOutfit[];
  currentItemId: string;
  occasion: RecommendationOccasion;
  weather: WeatherSnapshot;
}) {
  const current = items.find((item) => item.id === currentItemId);
  if (!current) return [];
  const used = new Set(outfits.flatMap((outfit) => outfit.itemIds));
  const seasons = seasonForTemperature(weather.apparentTemperatureC);

  return items
    .filter(
      (item) =>
        item.status === "active" &&
        item.category === current.category &&
        !used.has(item.id) &&
        item.occasions.includes(occasion) &&
        item.seasons.some((season) => seasons.includes(season)),
    )
    .sort((a, b) => {
      const styleMatch =
        Number(b.style === current.style) - Number(a.style === current.style);
      const colorChange =
        Number(b.primary_color !== current.primary_color) -
        Number(a.primary_color !== current.primary_color);
      return styleMatch || colorChange || a.name.localeCompare(b.name, "zh-CN");
    });
}

export function replaceRecommendationItem({
  outfits,
  currentItemId,
  replacementItemId,
  slot,
  items,
  occasion,
  weather,
}: {
  outfits: RecommendationOutfit[];
  currentItemId: string;
  replacementItemId: string;
  slot: 1 | 2 | 3;
  items: RecommendationWardrobeItem[];
  occasion: RecommendationOccasion;
  weather: WeatherSnapshot;
}) {
  const candidates = replacementCandidates({
    items,
    outfits,
    currentItemId,
    occasion,
    weather,
  });
  const current = items.find((item) => item.id === currentItemId);
  const replacement = candidates.find((item) => item.id === replacementItemId);
  if (!current || !replacement) return null;

  const next = outfits.map((outfit) =>
    outfit.slot === slot
      ? {
          ...outfit,
          itemIds: outfit.itemIds.map((id) =>
            id === currentItemId ? replacementItemId : id,
          ),
          reason: outfit.reason.replaceAll(current.name, replacement.name),
          lookbookImagePath: null,
          lookbookModel: null,
          lookbookGeneratedAt: null,
        }
      : outfit,
  );
  if (
    !outfits.find(
      (outfit) =>
        outfit.slot === slot && outfit.itemIds.includes(currentItemId),
    )
  ) {
    return null;
  }
  return validateRecommendationOutput(
    { outfits: next },
    items,
    occasion,
    weather,
  );
}
