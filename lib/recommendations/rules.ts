import {
  recommendationOccasionLabel,
  type RecommendationOccasion,
  type RecommendationOutfit,
  type RecommendationWardrobeItem,
  type WeatherSnapshot,
} from "@/lib/recommendations/constants";
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
  let score = 0;
  if (item.occasions.includes(occasion)) score += 12;
  if (item.seasons.some((season) => seasons.includes(season))) score += 7;
  if (preferredStyles.includes(item.style)) score += 4;
  if (item.style === occasion) score += 3;
  if (occasion === "formal" && item.style === "elegant") score += 3;
  if (occasion === "date" && ["elegant", "vintage"].includes(item.style)) {
    score += 3;
  }
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
) {
  const item = sortedCandidates(input.items, category, used, input)[0];
  if (!item) return null;
  used.add(item.id);
  selected.push(item);
  return item;
}

function enoughForThree(items: RecommendationWardrobeItem[], input: RuleInput) {
  const count = (category: Category) =>
    items.filter(
      (item) => item.status === "active" && item.category === category,
    ).length;
  const completeBases =
    count("dresses") + Math.min(count("tops"), count("bottoms"));
  return (
    completeBases >= 3 &&
    count("shoes") >= 3 &&
    items.filter(
      (item) =>
        item.status === "active" && item.occasions.includes(input.occasion),
    ).length >= 3 &&
    (input.weather.apparentTemperatureC > 8 || count("outerwear") >= 3)
  );
}

function takeOccasionAnchor(
  input: RuleInput,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
) {
  const candidates = sortedCandidates(input.items, null, used, input).filter(
    (item) => item.occasions.includes(input.occasion),
  );
  const prefersDress = input.occasion === "date" || input.occasion === "formal";
  const anchor =
    (prefersDress
      ? candidates.find((item) => item.category === "dresses")
      : null) ?? candidates[0];
  if (!anchor) throw new InsufficientWardrobeError();
  used.add(anchor.id);
  selected.push(anchor);
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
  const anchor = sortedCandidates(input.items, null, used, input).find((item) =>
    item.seasons.some((season) => seasons.includes(season)),
  );
  if (!anchor || selected.length >= 5) throw new InsufficientWardrobeError();
  used.add(anchor.id);
  selected.push(anchor);
}

function styleTags(
  selected: RecommendationWardrobeItem[],
  preferredStyles: string[],
) {
  const styles = [
    ...preferredStyles,
    ...selected.map((item) => item.style),
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
    takeOccasionAnchor(input, used, selected);

    const hasDress = selected.some((item) => item.category === "dresses");
    if (!hasDress) {
      const hasTop = selected.some((item) => item.category === "tops");
      const hasBottom = selected.some((item) => item.category === "bottoms");
      const top = hasTop
        ? selected.find((item) => item.category === "tops")
        : take(input, "tops", used, selected);
      const bottom = hasBottom
        ? selected.find((item) => item.category === "bottoms")
        : take(input, "bottoms", used, selected);
      if (!top || !bottom) {
        throw new InsufficientWardrobeError();
      }
    }

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

    completeSeasonAnchor(input, used, selected);

    if (
      selected.length < 5 &&
      index !== 1 &&
      !selected.some((item) => item.category === "accessories")
    ) {
      take(input, "accessories", used, selected);
    }

    raw.push({
      slot: (index + 1) as 1 | 2 | 3,
      title: `${TITLE_PREFIXES[index]}${recommendationOccasionLabel(input.occasion)}`,
      reason: reasonFor(selected, input.occasion, input.weather),
      styleTags: styleTags(selected, input.preferredStyles),
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
