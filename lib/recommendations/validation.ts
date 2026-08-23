import {
  isRecommendationOccasion,
  isWeatherPreset,
  type RecommendationOccasion,
  type RecommendationOutfit,
  type RecommendationWardrobeItem,
  type WeatherSnapshot,
} from "@/lib/recommendations/constants";
import { STYLE_OPTIONS, type Season } from "@/lib/wardrobe/constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function seasonForTemperature(apparentTemperatureC: number): Season[] {
  if (apparentTemperatureC <= 8) return ["winter"];
  if (apparentTemperatureC <= 18) return ["spring", "autumn"];
  if (apparentTemperatureC >= 27) return ["summer"];
  return ["spring", "summer", "autumn"];
}

export function validateWeatherSnapshot(
  value: unknown,
): WeatherSnapshot | null {
  if (!isRecord(value)) return null;
  const {
    apparentTemperatureC,
    city,
    observedAt,
    preset,
    source,
    summary,
    temperatureC,
    weatherCode,
  } = value;
  if (
    typeof city !== "string" ||
    city.length < 1 ||
    city.length > 40 ||
    typeof summary !== "string" ||
    summary.length < 1 ||
    summary.length > 20 ||
    typeof observedAt !== "string" ||
    Number.isNaN(Date.parse(observedAt)) ||
    (source !== "live" && source !== "simulated") ||
    typeof preset !== "string" ||
    !isWeatherPreset(preset) ||
    typeof temperatureC !== "number" ||
    temperatureC < -60 ||
    temperatureC > 60 ||
    typeof apparentTemperatureC !== "number" ||
    apparentTemperatureC < -60 ||
    apparentTemperatureC > 60 ||
    typeof weatherCode !== "number" ||
    weatherCode < 0 ||
    weatherCode > 99
  ) {
    return null;
  }
  return {
    city,
    temperatureC,
    apparentTemperatureC,
    weatherCode,
    summary,
    source,
    observedAt,
    preset,
  };
}

export function validateRecommendationOutput(
  value: unknown,
  items: RecommendationWardrobeItem[],
  occasion: RecommendationOccasion,
  weather: WeatherSnapshot,
): RecommendationOutfit[] | null {
  if (!isRecord(value) || !Array.isArray(value.outfits)) return null;
  if (value.outfits.length !== 3) return null;

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const used = new Set<string>();
  const seenSlots = new Set<number>();
  const expectedSeasons = seasonForTemperature(weather.apparentTemperatureC);
  const styleValues = new Set(STYLE_OPTIONS.map((option) => option.value));
  const outfits: RecommendationOutfit[] = [];

  for (const candidate of value.outfits) {
    if (!isRecord(candidate)) return null;
    const { itemIds, reason, slot, styleTags, title } = candidate;
    if (
      (slot !== 1 && slot !== 2 && slot !== 3) ||
      seenSlots.has(slot) ||
      typeof title !== "string" ||
      title.trim().length < 1 ||
      title.trim().length > 30 ||
      typeof reason !== "string" ||
      reason.trim().length < 1 ||
      reason.trim().length > 140 ||
      !Array.isArray(styleTags) ||
      styleTags.length < 1 ||
      styleTags.length > 3 ||
      !styleTags.every(
        (tag) => typeof tag === "string" && styleValues.has(tag as never),
      ) ||
      new Set(styleTags).size !== styleTags.length ||
      !Array.isArray(itemIds) ||
      itemIds.length < 2 ||
      itemIds.length > 5 ||
      !itemIds.every((id) => typeof id === "string" && isUuid(id)) ||
      new Set(itemIds).size !== itemIds.length
    ) {
      return null;
    }

    const outfitItems = itemIds.flatMap((id) => {
      const item = itemMap.get(id);
      return item && item.status === "active" ? [item] : [];
    });
    if (outfitItems.length !== itemIds.length) return null;
    if (itemIds.some((id) => used.has(id))) return null;

    const categories = new Set(outfitItems.map((item) => item.category));
    const completeBase =
      categories.has("dresses") ||
      (categories.has("tops") && categories.has("bottoms"));
    if (!completeBase || !categories.has("shoes")) return null;
    if (
      categories.has("dresses") &&
      (categories.has("tops") || categories.has("bottoms"))
    ) {
      return null;
    }
    if (!outfitItems.some((item) => item.occasions.includes(occasion))) {
      return null;
    }
    if (
      !outfitItems.some((item) =>
        item.seasons.some((season) => expectedSeasons.includes(season)),
      )
    ) {
      return null;
    }
    if (weather.apparentTemperatureC <= 8 && !categories.has("outerwear")) {
      return null;
    }
    if (
      weather.apparentTemperatureC >= 27 &&
      outfitItems.some(
        (item) => item.seasons.length === 1 && item.seasons[0] === "winter",
      )
    ) {
      return null;
    }

    seenSlots.add(slot);
    for (const id of itemIds) used.add(id);
    outfits.push({
      slot,
      title: title.trim(),
      reason: reason.trim(),
      styleTags: styleTags as RecommendationOutfit["styleTags"],
      itemIds,
    });
  }

  return outfits.sort((a, b) => a.slot - b.slot);
}

export function parseRecommendationOccasion(value: unknown) {
  return typeof value === "string" && isRecommendationOccasion(value)
    ? value
    : null;
}
