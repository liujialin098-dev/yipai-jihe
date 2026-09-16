import type { RecommendationOccasion } from "@/lib/recommendations/constants";
import type { WardrobeStyle } from "@/lib/wardrobe/constants";

export const FASHION_TOPICS = [
  "trend",
  "color",
  "item",
  "occasion",
  "seasonal",
  "weather",
  "street",
  "accessory",
] as const;

export type FashionTopic = (typeof FASHION_TOPICS)[number];

export const FASHION_TOPIC_LABELS: Record<FashionTopic, string> = {
  trend: "趋势观察",
  color: "配色灵感",
  item: "单品穿法",
  occasion: "场景搭配",
  seasonal: "换季指南",
  weather: "天气穿搭",
  street: "街头风格",
  accessory: "配饰细节",
};

export type FashionContentItem = {
  id: string;
  title: string;
  summary: string;
  topic: FashionTopic;
  styles: WardrobeStyle[];
  occasions: RecommendationOccasion[];
  publishedAt: string;
  validUntil: string;
  fetchedAt?: string;
  sourceName: string;
  sourceUrl: string;
  topicFingerprint: string;
  originalTitle?: string;
  summaryKind?: "source-summary" | "reading-guide";
};

export type FashionPreferences = {
  topics: FashionTopic[];
  personalized: boolean;
  unreadEnabled: boolean;
};

export type FashionActionState = { ok: boolean; message: string };

export function isFashionTopic(value: unknown): value is FashionTopic {
  return FASHION_TOPICS.includes(value as FashionTopic);
}

export function normalizeFashionTopics(
  values: unknown[],
): FashionTopic[] | null {
  if (values.some((value) => !isFashionTopic(value))) return null;
  const topics = [...new Set(values.filter(isFashionTopic))];
  return topics.length > 0 && topics.length <= FASHION_TOPICS.length
    ? topics
    : null;
}

export function isFashionContentId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{7,95}$/.test(value);
}
