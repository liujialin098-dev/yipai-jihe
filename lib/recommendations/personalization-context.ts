import type {
  FashionContentItem,
  FashionTopic,
} from "@/lib/inspiration/validation";
import type { RecommendationOccasion } from "@/lib/recommendations/constants";
import {
  isWardrobeStyle,
  STYLE_OPTIONS,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

export type RecommendationPreferenceProfile = {
  personalized: boolean;
  explicitStyles: WardrobeStyle[];
  learnedStyles: Array<{ style: WardrobeStyle; score: number }>;
  preferredOccasions: string[];
};

export type RecommendationTrendSignal = {
  id: string;
  title: string;
  topic: FashionTopic;
  styles: WardrobeStyle[];
  occasions: RecommendationOccasion[];
  publishedAt: string;
  sourceName: string;
  sourceUrl: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildRecommendationPreferenceProfile({
  personalized,
  preferredStyles,
  preferredOccasions,
  styleScores,
}: {
  personalized: boolean;
  preferredStyles: string[];
  preferredOccasions: string[];
  styleScores: unknown;
}): RecommendationPreferenceProfile {
  const explicitStyles = [
    ...new Set(preferredStyles.filter(isWardrobeStyle)),
  ].slice(0, 3);
  const learnedStyles =
    personalized && isRecord(styleScores)
      ? STYLE_OPTIONS.flatMap(({ value }) => {
          const score = styleScores[value];
          return typeof score === "number" &&
            Number.isFinite(score) &&
            score > 0
            ? [{ style: value, score: Number(score.toFixed(2)) }]
            : [];
        })
          .sort((a, b) => b.score - a.score || a.style.localeCompare(b.style))
          .slice(0, 5)
      : [];
  return {
    personalized,
    explicitStyles,
    learnedStyles,
    preferredOccasions: [...new Set(preferredOccasions)].slice(0, 4),
  };
}

export function selectDailyTrendSignals(
  items: FashionContentItem[],
  input: {
    now?: Date;
    occasion: RecommendationOccasion;
    styleDirections: readonly WardrobeStyle[];
    preferredStyles: readonly string[];
    topics: readonly string[];
  },
): RecommendationTrendSignal[] {
  const now = (input.now ?? new Date()).getTime();
  const topics = new Set(input.topics);
  const directions = new Set(input.styleDirections);
  const preferred = new Set(input.preferredStyles.filter(isWardrobeStyle));

  return items
    .filter((item) => {
      const publishedAt = Date.parse(item.publishedAt);
      const validUntil = Date.parse(item.validUntil);
      return (
        Number.isFinite(publishedAt) &&
        Number.isFinite(validUntil) &&
        publishedAt <= now &&
        validUntil > now &&
        item.sourceName.trim().length > 0 &&
        /^https:\/\//i.test(item.sourceUrl) &&
        (topics.size === 0 || topics.has(item.topic))
      );
    })
    .map((item) => {
      const directionMatch = item.styles.some((style) => directions.has(style));
      const preferenceMatch = item.styles.some((style) => preferred.has(style));
      const occasionMatch = item.occasions.includes(input.occasion);
      const ageDays = Math.max(
        0,
        (now - Date.parse(item.publishedAt)) / 86_400_000,
      );
      return {
        item,
        score:
          60 -
          ageDays +
          (directionMatch ? 30 : 0) +
          (preferenceMatch ? 18 : 0) +
          (occasionMatch ? 12 : 0),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.item.publishedAt.localeCompare(a.item.publishedAt) ||
        a.item.id.localeCompare(b.item.id),
    )
    .slice(0, 4)
    .map(({ item }) => ({
      id: item.id,
      title: item.title.slice(0, 120),
      topic: item.topic,
      styles: item.styles.slice(0, 4),
      occasions: item.occasions.slice(0, 4),
      publishedAt: item.publishedAt,
      sourceName: item.sourceName.slice(0, 40),
      sourceUrl: item.sourceUrl,
    }));
}

export async function getDailyRecommendationTrendSignals(input: {
  occasion: RecommendationOccasion;
  styleDirections: readonly WardrobeStyle[];
  preferredStyles: readonly string[];
  topics: readonly string[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  try {
    const { getTrustedFashionContent } = await import(
      "@/lib/inspiration/content"
    );
    const items = await getTrustedFashionContent(now, false);
    return selectDailyTrendSignals(items, { ...input, now });
  } catch {
    return [];
  }
}
