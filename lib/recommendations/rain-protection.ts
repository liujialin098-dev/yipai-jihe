import type {
  RecommendationOccasion,
  RecommendationOutfit,
  RecommendationWardrobeItem,
} from "@/lib/recommendations/constants";
import {
  hasOccasionConflict,
  itemProvidesOccasionSignal,
} from "@/lib/recommendations/occasion-profile";
import type { Season } from "@/lib/wardrobe/constants";

export type RainProtectionRole = "outerwear" | "bottoms" | "shoes";

const OUTERWEAR_KEYWORDS = [
  "冲锋衣",
  "防水外套",
  "防水夹克",
  "雨衣",
  "硬壳",
  "软壳",
  "waterproofjacket",
  "raincoat",
] as const;
const BOTTOMS_KEYWORDS = [
  "冲锋裤",
  "防水裤",
  "雨裤",
  "waterproofpants",
  "rainpants",
] as const;
const SHOES_KEYWORDS = [
  "防水鞋",
  "防水靴",
  "雨鞋",
  "雨靴",
  "waterproofshoes",
  "waterproofboots",
  "rainboots",
] as const;

function normalizedName(name: string) {
  return name.toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

function includesKeyword(name: string, keywords: readonly string[]) {
  const normalized = normalizedName(name);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function includesWaterproofNoun(name: string, nouns: readonly string[]) {
  const normalized = normalizedName(name);
  const waterproof =
    normalized.includes("防水") || normalized.includes("waterproof");
  return waterproof && nouns.some((noun) => normalized.includes(noun));
}

export function isRainyWeatherCode(weatherCode: number) {
  return (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99)
  );
}

export function rainProtectionRole(
  item: RecommendationWardrobeItem,
): RainProtectionRole | null {
  if (
    item.category === "outerwear" &&
    (includesKeyword(item.name, OUTERWEAR_KEYWORDS) ||
      includesWaterproofNoun(item.name, [
        "衣",
        "外套",
        "夹克",
        "jacket",
        "coat",
      ]))
  ) {
    return "outerwear";
  }
  if (
    item.category === "bottoms" &&
    (includesKeyword(item.name, BOTTOMS_KEYWORDS) ||
      includesWaterproofNoun(item.name, ["裤", "pants", "trousers"]))
  ) {
    return "bottoms";
  }
  if (
    item.category === "shoes" &&
    (includesKeyword(item.name, SHOES_KEYWORDS) ||
      includesWaterproofNoun(item.name, ["鞋", "靴", "shoe", "boot"]))
  ) {
    return "shoes";
  }
  return null;
}

function isSeasonEligible(
  item: RecommendationWardrobeItem,
  expectedSeasons: readonly Season[],
  apparentTemperatureC: number,
) {
  if (!item.seasons.some((season) => expectedSeasons.includes(season))) {
    return false;
  }
  return !(
    apparentTemperatureC >= 27 &&
    item.category === "outerwear" &&
    !item.seasons.includes("summer")
  );
}

export function rainProtectionInventory(
  items: RecommendationWardrobeItem[],
  occasion: RecommendationOccasion,
  expectedSeasons: readonly Season[],
  apparentTemperatureC: number,
) {
  const eligible = items.filter(
    (item) =>
      item.status === "active" &&
      !hasOccasionConflict(item, occasion) &&
      isSeasonEligible(item, expectedSeasons, apparentTemperatureC),
  );
  return {
    outerwear: eligible.filter(
      (item) => rainProtectionRole(item) === "outerwear",
    ),
    bottoms: eligible.filter((item) => rainProtectionRole(item) === "bottoms"),
    shoes: eligible.filter((item) => rainProtectionRole(item) === "shoes"),
  } satisfies Record<RainProtectionRole, RecommendationWardrobeItem[]>;
}

export function hasCompleteRainProtectionCandidate(
  items: RecommendationWardrobeItem[],
  occasion: RecommendationOccasion,
  expectedSeasons: readonly Season[],
  apparentTemperatureC: number,
) {
  const inventory = rainProtectionInventory(
    items,
    occasion,
    expectedSeasons,
    apparentTemperatureC,
  );
  if (
    inventory.outerwear.length === 0 ||
    inventory.bottoms.length === 0 ||
    inventory.shoes.length === 0
  ) {
    return false;
  }

  const eligible = items.filter(
    (item) => item.status === "active" && !hasOccasionConflict(item, occasion),
  );
  if (!eligible.some((item) => item.category === "tops")) return false;

  const signalSlots = [
    eligible.some(
      (item) =>
        item.category === "tops" && itemProvidesOccasionSignal(item, occasion),
    ),
    inventory.bottoms.some((item) =>
      itemProvidesOccasionSignal(item, occasion),
    ),
    inventory.shoes.some((item) => itemProvidesOccasionSignal(item, occasion)),
    inventory.outerwear.some((item) =>
      itemProvidesOccasionSignal(item, occasion),
    ),
    eligible.some(
      (item) =>
        item.category === "accessories" &&
        itemProvidesOccasionSignal(item, occasion),
    ),
  ].filter(Boolean).length;
  return signalSlots >= 2;
}

export function outfitHasCompleteRainProtection(
  outfit: RecommendationOutfit,
  itemMap: ReadonlyMap<string, RecommendationWardrobeItem>,
) {
  const roles = new Set(
    outfit.itemIds.flatMap((itemId) => {
      const item = itemMap.get(itemId);
      const role = item ? rainProtectionRole(item) : null;
      return role ? [role] : [];
    }),
  );
  return roles.has("outerwear") && roles.has("bottoms") && roles.has("shoes");
}
