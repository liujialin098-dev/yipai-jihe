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
import {
  hasCompleteRainProtectionCandidate,
  isRainyWeatherCode,
  outfitHasCompleteRainProtection,
  rainProtectionRole,
  type RainProtectionRole,
} from "@/lib/recommendations/rain-protection";
import { resolveStyleDirections } from "@/lib/recommendations/style-direction";
import {
  seasonForTemperature,
  validateRecommendationOutput,
} from "@/lib/recommendations/validation";
import {
  STYLE_OPTIONS,
  optionLabel,
  type Category,
  type Season,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

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
  styleDirections?: [WardrobeStyle, WardrobeStyle, WardrobeStyle];
  targetStyle?: WardrobeStyle;
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
  targetStyle?: WardrobeStyle,
) {
  let score = occasionProfileScore(item, occasion);
  if (item.seasons.some((season) => seasons.includes(season))) score += 7;
  if (preferredStyles.includes(item.style)) score += 4;
  if (targetStyle === item.style) score += 6;
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
        itemScore(
          b,
          input.occasion,
          seasons,
          input.preferredStyles,
          input.targetStyle,
        ) -
        itemScore(
          a,
          input.occasion,
          seasons,
          input.preferredStyles,
          input.targetStyle,
        );
      return score || a.id.localeCompare(b.id);
    });
}

function takeMatching(
  input: RuleInput,
  category: Category | null,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
  predicate: (item: RecommendationWardrobeItem) => boolean,
  allowDiscouragedFallback = true,
) {
  const candidates = sortedCandidates(
    input.items,
    category,
    used,
    input,
  ).filter(predicate);
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
    ? (suitableCandidates.find((candidate) =>
        itemProvidesOccasionSignal(candidate, input.occasion),
      ) ??
      (allowDiscouragedFallback
        ? candidates.find((candidate) =>
            itemProvidesOccasionSignal(candidate, input.occasion),
          )
        : null) ??
      candidatePool[0])
    : (candidatePool.find(
        (candidate) => !itemProvidesOccasionSignal(candidate, input.occasion),
      ) ?? candidatePool[0]);
  if (!item) return null;
  used.add(item.id);
  selected.push(item);
  return item;
}

function take(
  input: RuleInput,
  category: Category | null,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
  allowDiscouragedFallback = true,
) {
  return takeMatching(
    input,
    category,
    used,
    selected,
    () => true,
    allowDiscouragedFallback,
  );
}

function takeRainProtection(
  input: RuleInput,
  role: RainProtectionRole,
  used: Set<string>,
  selected: RecommendationWardrobeItem[],
) {
  return takeMatching(
    input,
    role,
    used,
    selected,
    (item) => rainProtectionRole(item) === role,
  );
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
  prioritizeRainProtection = false,
) {
  const prefersDress =
    !prioritizeRainProtection &&
    (input.occasion === "date" || input.occasion === "formal");
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
  const bottom = prioritizeRainProtection
    ? takeRainProtection(input, "bottoms", used, selected)
    : take(input, "bottoms", used, selected);
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
  const seasons = seasonForTemperature(input.weather.apparentTemperatureC);
  if (
    selected.some((item) =>
      item.seasons.some((season) => seasons.includes(season)),
    )
  ) {
    return;
  }
  const hasDress = selected.some((item) => item.category === "dresses");
  const anchorCandidates = sortedCandidates(
    input.items,
    null,
    used,
    input,
  ).filter(
    (item) =>
      item.seasons.some((season) => seasons.includes(season)) &&
      !(
        input.weather.apparentTemperatureC >= 27 &&
        item.category === "outerwear" &&
        !item.seasons.includes("summer")
      ) &&
      (hasDress
        ? item.category !== "tops" && item.category !== "bottoms"
        : item.category !== "dresses"),
  );
  const anchor =
    anchorCandidates.find(
      (item) =>
        item.category === "accessories" || item.category === "outerwear",
    ) ?? anchorCandidates[0];
  if (!anchor || selected.length >= 5) throw new InsufficientWardrobeError();
  used.add(anchor.id);
  selected.push(anchor);
}

function styleTags(
  selected: RecommendationWardrobeItem[],
  preferredStyles: string[],
  occasion: RecommendationOccasion,
  targetStyle: WardrobeStyle,
) {
  const styles = [
    targetStyle,
    ...getOccasionProfile(occasion).preferredStyles,
    ...selected.map((item) => item.style),
    ...preferredStyles,
  ].filter((style): style is WardrobeStyle =>
    STYLE_OPTIONS.some((option) => option.value === style),
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
  const itemMap = new Map(selected.map((item) => [item.id, item]));
  const rainNote =
    isRainyWeatherCode(weather.weatherCode) &&
    outfitHasCompleteRainProtection(
      {
        slot: 1,
        title: "",
        reason: "",
        stylingPoint: "",
        styleTags: [],
        itemIds: selected.map((item) => item.id),
      },
      itemMap,
    )
      ? "，并用完整防水组合应对降雨"
      : "";
  return `${weather.summary}，体感 ${weather.apparentTemperatureC}°C。用${names}完成${recommendationOccasionLabel(occasion)}层次${rainNote}，颜色和材质保持轻重平衡。`.slice(
    0,
    140,
  );
}

function stylingPointFor(
  selected: RecommendationWardrobeItem[],
  targetStyle: WardrobeStyle,
) {
  const styleLabel = optionLabel(STYLE_OPTIONS, targetStyle);
  const hasOuterwear = selected.some((item) => item.category === "outerwear");
  const hasAccessory = selected.some((item) => item.category === "accessories");
  if (hasOuterwear)
    return `用外套拉开${styleLabel}层次，内搭与下装保持一明一暗。`;
  if (hasAccessory)
    return `把配饰作为${styleLabel}重点，其余单品控制在相邻色。`;
  return `保持${styleLabel}方向，用上短下长或同色深浅整理比例。`;
}

export function buildRuleRecommendations(input: RuleInput) {
  if (!enoughForThree(input.items, input)) {
    throw new InsufficientWardrobeError();
  }

  const used = new Set<string>();
  const raw: RecommendationOutfit[] = [];
  const styleDirections =
    input.styleDirections ??
    resolveStyleDirections({
      focus: "auto",
      occasion: input.occasion,
      preferredStyles: input.preferredStyles,
    });
  const shouldBuildRainProtection =
    isRainyWeatherCode(input.weather.weatherCode) &&
    hasCompleteRainProtectionCandidate(
      input.items,
      input.occasion,
      seasonForTemperature(input.weather.apparentTemperatureC),
      input.weather.apparentTemperatureC,
    );

  for (let index = 0; index < 3; index += 1) {
    const targetStyle = styleDirections[index];
    const outfitInput: RuleInput = { ...input, targetStyle };
    const selected: RecommendationWardrobeItem[] = [];
    const prioritizeRainProtection = shouldBuildRainProtection && index === 0;
    takeBase(outfitInput, used, selected, prioritizeRainProtection);

    if (
      !selected.some((item) => item.category === "shoes") &&
      !(prioritizeRainProtection
        ? takeRainProtection(outfitInput, "shoes", used, selected)
        : take(outfitInput, "shoes", used, selected))
    ) {
      throw new InsufficientWardrobeError();
    }
    if (
      prioritizeRainProtection &&
      !selected.some((item) => item.category === "outerwear") &&
      !takeRainProtection(outfitInput, "outerwear", used, selected)
    ) {
      throw new InsufficientWardrobeError();
    }
    if (
      input.weather.apparentTemperatureC <= 8 &&
      !selected.some((item) => item.category === "outerwear") &&
      !take(outfitInput, "outerwear", used, selected)
    ) {
      throw new InsufficientWardrobeError();
    }

    completeOccasionFit(outfitInput, used, selected);
    completeSeasonAnchor(outfitInput, used, selected);

    if (
      selected.length < 5 &&
      !selected.some((item) => item.category === "accessories")
    ) {
      take(outfitInput, "accessories", used, selected, false);
    }

    if (
      input.occasion === "formal" &&
      input.weather.apparentTemperatureC <= 26 &&
      selected.length < 5 &&
      !selected.some((item) => item.category === "outerwear")
    ) {
      take(outfitInput, "outerwear", used, selected, false);
    }

    raw.push({
      slot: (index + 1) as 1 | 2 | 3,
      title: `${TITLE_PREFIXES[index]}${recommendationOccasionLabel(input.occasion)}`,
      reason: reasonFor(selected, input.occasion, input.weather),
      stylingPoint: stylingPointFor(selected, targetStyle),
      styleTags: styleTags(
        selected,
        input.preferredStyles,
        input.occasion,
        targetStyle,
      ),
      itemIds: selected.map((item) => item.id),
    });
  }

  const validated = validateRecommendationOutput(
    { outfits: raw },
    input.items,
    input.occasion,
    input.weather,
    styleDirections,
  );
  if (!validated) throw new InsufficientWardrobeError();
  return validated;
}
