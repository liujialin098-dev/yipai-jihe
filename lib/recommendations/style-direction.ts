import type { RecommendationOccasion } from "@/lib/recommendations/constants";
import { isWardrobeStyle, type WardrobeStyle } from "@/lib/wardrobe/constants";

export const AUTO_STYLE_FOCUS = "auto" as const;
export type RecommendationStyleFocus = typeof AUTO_STYLE_FOCUS | WardrobeStyle;

export const OCCASION_STYLE_OPTIONS: Record<
  RecommendationOccasion,
  readonly WardrobeStyle[]
> = {
  commute: ["commute", "minimal", "cleanfit", "preppy", "oldmoney", "elegant"],
  casual: [
    "casual",
    "cleanfit",
    "streetwear",
    "cityboy",
    "gorpcore",
    "workwear",
    "sporty",
    "vintage",
    "y2k",
    "minimal",
  ],
  date: ["elegant", "oldmoney", "vintage", "cleanfit", "y2k", "minimal"],
  formal: ["elegant", "oldmoney", "minimal", "cleanfit"],
};

export function isRecommendationStyleFocus(
  value: string,
): value is RecommendationStyleFocus {
  return value === AUTO_STYLE_FOCUS || isWardrobeStyle(value);
}

export function styleSupportsOccasion(
  style: WardrobeStyle,
  occasion: RecommendationOccasion,
) {
  return OCCASION_STYLE_OPTIONS[occasion].includes(style);
}

export function resolveStyleDirections({
  focus,
  occasion,
  preferredStyles,
}: {
  focus: RecommendationStyleFocus;
  occasion: RecommendationOccasion;
  preferredStyles: string[];
}): [WardrobeStyle, WardrobeStyle, WardrobeStyle] {
  const compatible = OCCASION_STYLE_OPTIONS[occasion];
  if (focus !== AUTO_STYLE_FOCUS && compatible.includes(focus)) {
    return [focus, focus, focus];
  }

  const ordered = [
    ...preferredStyles.filter(
      (style): style is WardrobeStyle =>
        isWardrobeStyle(style) && compatible.includes(style),
    ),
    ...compatible,
  ];
  const unique = [...new Set(ordered)];
  return [unique[0], unique[1] ?? unique[0], unique[2] ?? unique[0]];
}
