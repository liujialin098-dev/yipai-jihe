import type {
  RecommendationOccasion,
  RecommendationWardrobeItem,
} from "@/lib/recommendations/constants";
import type {
  Category,
  Occasion,
  WardrobeStyle,
} from "@/lib/wardrobe/constants";

export type OccasionProfile = {
  discouragedStyles: readonly WardrobeStyle[];
  forbidSportOnly: boolean;
  preferredStyles: readonly WardrobeStyle[];
  relatedOccasions: readonly Occasion[];
  selectionGuidance: string;
  summary: string;
};

export type OccasionFit = {
  conflictingItemIds: string[];
  matchedItemIds: string[];
  passes: boolean;
  signalCount: number;
};

export const OCCASION_PROFILES: Record<
  RecommendationOccasion,
  OccasionProfile
> = {
  commute: {
    summary: "利落、克制、方便行动，适合工作与城市通勤",
    preferredStyles: ["commute", "minimal", "elegant"],
    relatedOccasions: ["formal"],
    discouragedStyles: ["sporty"],
    forbidSportOnly: false,
    selectionGuidance:
      "优先衬衫、针织、利落裤装和通勤鞋；颜色克制，避免整套都偏运动。",
  },
  casual: {
    summary: "舒适、放松、低负担，允许更轻快的颜色和运动感",
    preferredStyles: ["casual", "sporty", "minimal"],
    relatedOccasions: ["sport"],
    discouragedStyles: ["commute"],
    forbidSportOnly: false,
    selectionGuidance: "优先棉质、牛仔、宽松或运动休闲单品；避免整套过于严肃。",
  },
  date: {
    summary: "精致、柔和、有视觉重点，但不限定性别或裙装",
    preferredStyles: ["elegant", "vintage", "minimal"],
    relatedOccasions: [],
    discouragedStyles: ["sporty"],
    forbidSportOnly: false,
    selectionGuidance:
      "优先质感面料、协调配色和一处精致重点；男装、女装都不得强制裙装。",
  },
  formal: {
    summary: "结构清晰、优雅、低随意度，适合正式活动",
    preferredStyles: ["elegant", "commute", "minimal"],
    relatedOccasions: ["commute"],
    discouragedStyles: ["sporty", "casual"],
    forbidSportOnly: true,
    selectionGuidance:
      "优先西裤、通勤鞋、结构感外套和克制配饰；不得使用仅适合运动的单品。",
  },
};

export const CORE_RECOMMENDATION_CATEGORIES: ReadonlySet<Category> = new Set([
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
]);

export function getOccasionProfile(occasion: RecommendationOccasion) {
  return OCCASION_PROFILES[occasion];
}

export function isSportOnlyItem(item: RecommendationWardrobeItem) {
  return item.occasions.length === 1 && item.occasions[0] === "sport";
}

export function hasOccasionConflict(
  item: RecommendationWardrobeItem,
  occasion: RecommendationOccasion,
) {
  return OCCASION_PROFILES[occasion].forbidSportOnly && isSportOnlyItem(item);
}

export function itemProvidesOccasionSignal(
  item: RecommendationWardrobeItem,
  occasion: RecommendationOccasion,
) {
  if (hasOccasionConflict(item, occasion)) return false;
  const profile = OCCASION_PROFILES[occasion];
  return (
    item.occasions.includes(occasion) ||
    item.occasions.some((itemOccasion) =>
      profile.relatedOccasions.includes(itemOccasion),
    ) ||
    profile.preferredStyles.includes(item.style)
  );
}

export function occasionProfileScore(
  item: RecommendationWardrobeItem,
  occasion: RecommendationOccasion,
) {
  if (hasOccasionConflict(item, occasion)) return -100;
  const profile = OCCASION_PROFILES[occasion];
  let score = 0;
  if (item.occasions.includes(occasion)) score += 12;
  if (
    item.occasions.some((itemOccasion) =>
      profile.relatedOccasions.includes(itemOccasion),
    )
  ) {
    score += 3;
  }
  if (profile.preferredStyles.includes(item.style)) score += 5;
  if (profile.discouragedStyles.includes(item.style)) score -= 5;
  return score;
}

export function evaluateOccasionFit(
  items: RecommendationWardrobeItem[],
  occasion: RecommendationOccasion,
): OccasionFit {
  const matchedItemIds = items
    .filter((item) => itemProvidesOccasionSignal(item, occasion))
    .map((item) => item.id);
  const conflictingItemIds = items
    .filter((item) => hasOccasionConflict(item, occasion))
    .map((item) => item.id);
  return {
    matchedItemIds,
    conflictingItemIds,
    signalCount: matchedItemIds.length,
    passes: matchedItemIds.length >= 2 && conflictingItemIds.length === 0,
  };
}

export function coreRecommendationItemIds(items: RecommendationWardrobeItem[]) {
  return new Set(
    items
      .filter((item) => CORE_RECOMMENDATION_CATEGORIES.has(item.category))
      .map((item) => item.id),
  );
}

export function coreItemJaccard(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
) {
  const intersection = [...left].filter((id) => right.has(id)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}
