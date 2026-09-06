import {
  isRecommendationOccasion,
  isWeatherPreset,
  type RecommendationOccasion,
  type RecommendationOutfit,
  type RecommendationWardrobeItem,
  type WeatherSnapshot,
} from "@/lib/recommendations/constants";
import { evaluateOccasionFit } from "@/lib/recommendations/occasion-profile";
import { qweatherCodeToWmo, safeAttributions } from "@/lib/weather/parse";
import {
  hasCompleteRainProtectionCandidate,
  isRainyWeatherCode,
  outfitHasCompleteRainProtection,
} from "@/lib/recommendations/rain-protection";
import { styleSupportsOccasion } from "@/lib/recommendations/style-direction";
import { hasValidLayerCounts } from "@/lib/recommendations/layers";
import {
  STYLE_OPTIONS,
  type Season,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

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
    !Number.isFinite(temperatureC) ||
    temperatureC < -60 ||
    temperatureC > 60 ||
    typeof apparentTemperatureC !== "number" ||
    !Number.isFinite(apparentTemperatureC) ||
    apparentTemperatureC < -60 ||
    apparentTemperatureC > 60 ||
    typeof weatherCode !== "number" ||
    !Number.isFinite(weatherCode) ||
    weatherCode < 0 ||
    weatherCode > 99
  ) {
    return null;
  }
  let extras: Partial<WeatherSnapshot> = {};
  if (value.provider !== undefined) {
    if (
      value.provider !== "qweather" ||
      source !== "live" ||
      preset !== "live" ||
      typeof value.targetDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.targetDate) ||
      (value.temperatureBasis !== "feels_like" &&
        value.temperatureBasis !== "air_minimum") ||
      typeof value.locationKey !== "string" ||
      value.locationKey.length > 300
    )
      return null;
    try {
      if (qweatherCodeToWmo(value.providerCode) !== weatherCode) return null;
    } catch {
      return null;
    }
    if (
      value.temperatureBasis === "air_minimum" &&
      (typeof value.temperatureMaxC !== "number" ||
        !Number.isFinite(value.temperatureMaxC) ||
        value.temperatureMaxC < temperatureC ||
        value.temperatureMaxC > 60 ||
        apparentTemperatureC !== temperatureC)
    )
      return null;
    for (const key of ["nightSummary", "daySummary"] as const) {
      if (
        value[key] !== undefined &&
        (typeof value[key] !== "string" || value[key].length > 20)
      )
        return null;
    }
    extras = {
      provider: "qweather",
      targetDate: value.targetDate,
      temperatureBasis: value.temperatureBasis,
      providerCode: value.providerCode as string,
      locationKey: value.locationKey,
      temperatureMaxC: value.temperatureMaxC as number | undefined,
      daySummary: value.daySummary as string | undefined,
      nightSummary: value.nightSummary as string | undefined,
      attributions: safeAttributions(value.attributions),
    };
  }
  return {
    ...extras,
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
  styleDirections?: [WardrobeStyle, WardrobeStyle, WardrobeStyle],
): RecommendationOutfit[] | null {
  if (!isRecord(value) || !Array.isArray(value.outfits)) return null;
  if (value.outfits.length !== 3) return null;

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const used = new Set<string>();
  const seenSlots = new Set<number>();
  const expectedSeasons = seasonForTemperature(weather.apparentTemperatureC);
  const styleValues = new Set(STYLE_OPTIONS.map((option) => option.value));
  const outfits: RecommendationOutfit[] = [];
  const requiresRainProtection =
    isRainyWeatherCode(weather.weatherCode) &&
    hasCompleteRainProtectionCandidate(
      items,
      occasion,
      expectedSeasons,
      weather.apparentTemperatureC,
    );

  for (const candidate of value.outfits) {
    if (!isRecord(candidate)) return null;
    const {
      itemIds,
      lookbookGeneratedAt,
      lookbookImagePath,
      lookbookModel,
      reason,
      slot,
      styleTags,
      stylingPoint,
      title,
    } = candidate;
    const normalizedLookbookPath = lookbookImagePath ?? null;
    const normalizedLookbookModel = lookbookModel ?? null;
    const normalizedLookbookGeneratedAt = lookbookGeneratedAt ?? null;
    const hasLookbook = normalizedLookbookPath !== null;
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
      (styleDirections
        ? styleTags[0] !== styleDirections[slot - 1]
        : !styleSupportsOccasion(styleTags[0] as WardrobeStyle, occasion)) ||
      (stylingPoint !== undefined &&
        (typeof stylingPoint !== "string" ||
          stylingPoint.trim().length < 1 ||
          stylingPoint.trim().length > 60)) ||
      !Array.isArray(itemIds) ||
      itemIds.length < 3 ||
      itemIds.length > 7 ||
      !itemIds.every((id) => typeof id === "string" && isUuid(id)) ||
      new Set(itemIds).size !== itemIds.length ||
      (normalizedLookbookPath !== null &&
        (typeof normalizedLookbookPath !== "string" ||
          !/^[0-9a-f-]{36}\/lookbooks\/[0-9a-f-]{36}\/[123]\.png$/i.test(
            normalizedLookbookPath,
          ))) ||
      (normalizedLookbookModel !== null &&
        (typeof normalizedLookbookModel !== "string" ||
          normalizedLookbookModel.length < 1 ||
          normalizedLookbookModel.length > 80)) ||
      (normalizedLookbookGeneratedAt !== null &&
        (typeof normalizedLookbookGeneratedAt !== "string" ||
          Number.isNaN(Date.parse(normalizedLookbookGeneratedAt)))) ||
      hasLookbook !==
        (normalizedLookbookModel !== null &&
          normalizedLookbookGeneratedAt !== null)
    ) {
      return null;
    }

    const outfitItems = itemIds.flatMap((id) => {
      const item = itemMap.get(id);
      return item && item.status === "active" ? [item] : [];
    });
    if (outfitItems.length !== itemIds.length) return null;
    if (itemIds.some((id) => used.has(id))) return null;
    if (!hasValidLayerCounts(outfitItems)) return null;

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
    if (!evaluateOccasionFit(outfitItems, occasion).passes) return null;
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
    if (
      weather.apparentTemperatureC >= 27 &&
      outfitItems.some(
        (item) =>
          item.category === "outerwear" && !item.seasons.includes("summer"),
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
      stylingPoint:
        typeof stylingPoint === "string" && stylingPoint.trim()
          ? stylingPoint.trim()
          : "保持配色和层次统一，按实际体感调整。",
      styleTags: styleTags as RecommendationOutfit["styleTags"],
      itemIds,
      lookbookImagePath: normalizedLookbookPath,
      lookbookModel: normalizedLookbookModel,
      lookbookGeneratedAt: normalizedLookbookGeneratedAt,
    });
  }

  const sortedOutfits = outfits.sort((a, b) => a.slot - b.slot);
  if (
    requiresRainProtection &&
    !sortedOutfits.some((outfit) =>
      outfitHasCompleteRainProtection(outfit, itemMap),
    )
  ) {
    return null;
  }
  return sortedOutfits;
}

export function parseRecommendationOccasion(value: unknown) {
  return typeof value === "string" && isRecommendationOccasion(value)
    ? value
    : null;
}
