import {
  recommendationOccasionLabel,
  type RecommendationOccasion,
  type RecommendationOutfit,
  type RecommendationWardrobeItem,
  type WeatherSnapshot,
} from "@/lib/recommendations/constants";
import {
  evaluateOccasionFit,
  getOccasionProfile,
  hasOccasionConflict,
  itemProvidesOccasionSignal,
  occasionProfileScore,
} from "@/lib/recommendations/occasion-profile";
import { validateRecommendationOutput } from "@/lib/recommendations/validation";
import type { Category, Season, WardrobeStyle } from "@/lib/wardrobe/constants";

export class InsufficientWardrobeError extends Error {
  constructor() {
    super("insufficient_wardrobe");
    this.name = "InsufficientWardrobeError";
  }
}

type RuleInput = {
  items: RecommendationWardrobeItem[];
  occasion: RecommendationOccasion;
  weather: WeatherSnapshot;
  preferredStyles: string[];
};

const TITLE_PREFIXES = ["清醒", "从容", "轻松"] as const;

function expectedSeasons(apparentTemperatureC: number): Season[] {
  if (apparentTemperatureC <= 8) return ["winter", "autumn"];
  if (apparentTemperatureC <= 18) return ["spring", "autumn", "winter"];
  if (apparentTemperatureC >= 27) return ["summer", "spring"];
  return ["spring", "summer", "autumn"];
}

function itemScore(
  item: RecommendationWardrobeItem,
  occasion: RecommendationOccasion,
  seasons: Season[],
  preferredStyles: string[],
) {
  let score = occasionProfileScore(item, occasion);
  if (item.seasons.some((season) => seasons.includes(season))) score += 7;
  if (preferredStyles.includes(item.style)) score += 4;
  return score;
}

function sortedCandidates(
  items: RecommendationWardrobeItem[],
  category: Category | null,
  used: Set<string>,
  input: RuleInput,
) {
  const seasons = expectedSeasons(input.weather.apparentTemperatureC);
  return items
    .filter(
      (item) =>
        item.status === "active" &&
        !used.has(item.id) &&
        !hasOccasionConflict(item, input.occasion) &&
        (category === null || item.category === category),
    )
    .sort((a, b) => {
      const score =
        itemScore(b, input.occasion, seasons, input.preferredStyles) -
        itemScore(a, input.occasion, seasons, input.preferredStyles);
      return score || a.id.localeCompare(b.id);
    });
}

function take(
  input: RuleInput,
  category: Category | null,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
  allowDiscouragedFallback = true,
) {
  const candidates = sortedCandidates(input.items, category, used, input);
  const profile = getOccasionProfile(input.occasion);
  const suitableCandidates = candidates.filter(
    (candidate) => !profile.discouragedStyles.includes(candidate.style),
  );
  const candidatePool =
    suitableCandidates.length > 0 || !allowDiscouragedFallback
      ? suitableCandidates
      : candidates;
  const needsSignal =
    evaluateOccasionFit(selected, input.occasion).signalCount < 2;
  const item = needsSignal
    ? (candidatePool.find((candidate) =>
        itemProvidesOccasionSignal(candidate, input.occasion),
      ) ?? candidatePool[0])
    : (candidatePool.find(
        (candidate) => !itemProvidesOccasionSignal(candidate, input.occasion),
      ) ?? candidatePool[0]);
  if (!item) return null;
  used.add(item.id);
  selected.push(item);
  return item;
}

function enoughForThree(items: RecommendationWardrobeItem[], input: RuleInput) {
  const eligible = items.filter(
    (item) =>
      item.status === "active" && !hasOccasionConflict(item, input.occasion),
  );
  const count = (category: Category) =>
    eligible.filter((item) => item.category === category).length;
  const completeBases =
    count("dresses") + Math.min(count("tops"), count("bottoms"));
  return (
    completeBases >= 3 &&
    count("shoes") >= 3 &&
    eligible.filter((item) => itemProvidesOccasionSignal(item, input.occasion))
      .length >= 6 &&
    (input.weather.apparentTemperatureC > 8 || count("outerwear") >= 3)
  );
}

function takeBase(
  input: RuleInput,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
) {
  const prefersDress = input.occasion === "date" || input.occasion === "formal";
  const dress = prefersDress
    ? sortedCandidates(input.items, "dresses", used, input).find((item) =>
        itemProvidesOccasionSignal(item, input.occasion),
      )
    : null;
  if (dress) {
    used.add(dress.id);
    selected.push(dress);
    return;
  }

  const top = take(input, "tops", used, selected);
  const bottom = take(input, "bottoms", used, selected);
  if (!top || !bottom) throw new InsufficientWardrobeError();
}

function completeOccasionFit(
  input: RuleInput,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
) {
  while (!evaluateOccasionFit(selected, input.occasion).passes) {
    if (selected.length >= 5) throw new InsufficientWardrobeError();
    const candidate = sortedCandidates(input.items, null, used, input).find(
      (item) =>
        itemProvidesOccasionSignal(item, input.occasion) &&
        (item.category === "accessories" || item.category === "outerwear"),
    );
    if (!candidate) throw new InsufficientWardrobeError();
    used.add(candidate.id);
    selected.push(candidate);
  }
}

function completeSeasonAnchor(
  input: RuleInput,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
) {
  const seasons = expectedSeasons(input.weather.apparentTemperatureC);
  if (
    selected.some((item) =>
      item.seasons.some((season) => seasons.includes(season)),
    )
  ) {
    return;
  }
  const hasDress = selected.some((item) => item.category === "dresses");
  const anchor = sortedCandidates(input.items, null, used, input).find(
    (item) =>
      item.seasons.some((season) => seasons.includes(season)) &&
      (hasDress
        ? item.category !== "tops" && item.category !== "bottoms"
        : item.category !== "dresses"),
  );
  if (!anchor || selected.length >= 5) throw new InsufficientWardrobeError();
  used.add(anchor.id);
  selected.push(anchor);
}

function styleTags(
  selected: RecommendationWardrobeItem[],
  preferredStyles: string[],
  occasion: RecommendationOccasion,
) {
  const styles = [
    ...getOccasionProfile(occasion).preferredStyles,
    ...selected.map((item) => item.style),
    ...preferredStyles,
  ].filter((style): style is WardrobeStyle =>
    ["minimal", "casual", "commute", "elegant", "sporty", "vintage"].includes(
      style,
    ),
  );
  return [...new Set(styles)].slice(0, 3) as WardrobeStyle[];
}

function reasonFor(
  selected: RecommendationWardrobeItem[],
  occasion: RecommendationOccasion,
  weather: WeatherSnapshot,
) {
  const names = selected
    .slice(0, 3)
    .map((item) => item.name)
    .join("、");
  const rainNote = weather.weatherCode >= 51 ? "，并照顾到雨天行动" : "";
  return `${weather.summary}，体感 ${weather.apparentTemperatureC}°C。用${names}完成${recommendationOccasionLabel(occasion)}层次${rainNote}，颜色和材质保持轻重平衡。`.slice(
    0,
    140,
  );
}

export function buildRuleRecommendations(input: RuleInput) {
  if (!enoughForThree(input.items, input)) {
    throw new InsufficientWardrobeError();
  }

  const used = new Set<string>();
  const raw: RecommendationOutfit[] = [];

  for (let index = 0; index < 3; index += 1) {
    const selected: RecommendationWardrobeItem[] = [];
    takeBase(input, used, selected);

    if (
      !selected.some((item) => item.category === "shoes") &&
      !take(input, "shoes", used, selected)
    ) {
      throw new InsufficientWardrobeError();
    }
    if (
      input.weather.apparentTemperatureC <= 8 &&
      !selected.some((item) => item.category === "outerwear") &&
      !take(input, "outerwear", used, selected)
    ) {
      throw new InsufficientWardrobeError();
    }

    completeOccasionFit(input, used, selected);
    completeSeasonAnchor(input, used, selected);

    if (
      selected.length < 5 &&
      !selected.some((item) => item.category === "accessories")
    ) {
      take(input, "accessories", used, selected, false);
    }

    if (
      input.occasion === "formal" &&
      input.weather.apparentTemperatureC <= 26 &&
      selected.length < 5 &&
      !selected.some((item) => item.category === "outerwear")
    ) {
      take(input, "outerwear", used, selected, false);
    }

    raw.push({
      slot: (index + 1) as 1 | 2 | 3,
      title: `${TITLE_PREFIXES[index]}${recommendationOccasionLabel(input.occasion)}`,
      reason: reasonFor(selected, input.occasion, input.weather),
      styleTags: styleTags(selected, input.preferredStyles, input.occasion),
      itemIds: selected.map((item) => item.id),
    });
  }

  const validated = validateRecommendationOutput(
    { outfits: raw },
    input.items,
    input.occasion,
    input.weather,
  );
  if (!validated) throw new InsufficientWardrobeError();
  return validated;
}
