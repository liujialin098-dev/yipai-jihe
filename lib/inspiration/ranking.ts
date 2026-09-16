import type { Viewer } from "@/lib/auth/viewer";
import type { FashionImpression } from "@/lib/inspiration/content-rules";
import type {
  FashionContentItem,
  FashionPreferences,
} from "@/lib/inspiration/validation";

type WardrobeSignal = { category: string; style: string };
export type WeatherSignal = {
  city: string;
  summary: string;
  apparentTemperatureC: number;
  weatherCode: number;
} | null;
export type RankedFashionContent = FashionContentItem & {
  reason: string;
  score: number;
};

export function fashionFit(
  item: FashionContentItem,
  viewer: Pick<Viewer, "clothingPreference">,
  weather: WeatherSignal,
) {
  const title = item.originalTitle ?? item.title;
  const women = /\b(women|womenswear|women's|skirts?|dresses)\b/i.test(title);
  const men = /\b(men|menswear|men's)\b/i.test(title);
  if (viewer.clothingPreference === "male" && women && !men) return false;
  if (viewer.clothingPreference === "female" && men && !women) return false;
  if (weather) {
    const temperature = weather.apparentTemperatureC;
    if (
      temperature >= 28 &&
      /\b(winter|wool|puffer|heavy|thermal)\b/i.test(title)
    )
      return false;
    if (temperature < 12 && /\b(sandals?|shorts?|bikini|linen)\b/i.test(title))
      return false;
    const code = weather.weatherCode;
    const rainy =
      (code >= 51 && code <= 67) ||
      (code >= 80 && code <= 82) ||
      (code >= 95 && code <= 99);
    if (
      !rainy &&
      /\b(rain|rainy|raincoat|raincoats|waterproof|storm)\b/i.test(title)
    )
      return false;
  }
  return true;
}

export function rankFashionContent(input: {
  items: FashionContentItem[];
  preferences: FashionPreferences;
  viewer: Pick<
    Viewer,
    "preferredStyles" | "preferredOccasions" | "clothingPreference"
  >;
  wardrobe: WardrobeSignal[];
  weather: WeatherSignal;
  recentOccasions?: string[];
  impressions?: FashionImpression[];
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const recentTopics = new Set(
    (input.impressions ?? [])
      .filter((row) => {
        const seen = Date.parse(row.first_seen_at);
        return seen <= now && seen > now - 3 * 86_400_000;
      })
      .map((row) => row.topic_key),
  );
  return input.items
    .filter(
      (item) =>
        input.preferences.topics.includes(item.topic) &&
        Date.parse(item.publishedAt) <= now &&
        Date.parse(item.validUntil) > now &&
        (!input.preferences.personalized ||
          fashionFit(item, input.viewer, input.weather)),
    )
    .map((item) => {
      let score = 45 - (now - Date.parse(item.publishedAt)) / 86_400_000;
      if (
        input.preferences.personalized &&
        recentTopics.has(item.topicFingerprint)
      )
        score -= 10;
      let reason = "按原始发布时间排序；未使用你的衣橱、位置或个人偏好。";
      if (input.preferences.personalized) {
        const preferred = item.styles.some((style) =>
          input.viewer.preferredStyles.includes(style),
        );
        const owned = item.styles.some((style) =>
          input.wardrobe.some((piece) => piece.style === style),
        );
        const occasions = input.recentOccasions?.length
          ? input.recentOccasions
          : input.viewer.preferredOccasions;
        const scene = item.occasions.some((occasion) =>
          occasions.includes(occasion),
        );
        score += (preferred ? 14 : 0) + (owned ? 12 : 0) + (scene ? 8 : 0);
        // Weather is a safety filter, never evidence that any weather article
        // suits an overcast day. Only a matching article gets a weather reason.
        if (input.weather && item.topic === "weather") score += 5;
        reason = owned
          ? "衣橱里已有相近风格的单品，可以先用现有衣服试一试。"
          : preferred
            ? "与你选择的穿搭风格相近。"
            : scene
              ? "与近期记录或常用场景相近，具体单品仍需按天气选择。"
              : "近期来源内容；暂时没有足够的个人信号，先作为通用灵感。";
      }
      return { ...item, score, reason };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.id.localeCompare(b.id),
    );
}

export function selectFashionFeed(
  input: Parameters<typeof rankFashionContent>[0],
) {
  const preferred = rankFashionContent(input);
  // Broaden only topics when there are too few matches. Keep audience,
  // weather and expiry checks, and do not rewrite the saved preferences.
  const supplemental =
    preferred.length < 6
      ? rankFashionContent({
          ...input,
          preferences: {
            ...input.preferences,
            topics: [...new Set(input.items.map((item) => item.topic))],
          },
        }).filter((item) => !input.preferences.topics.includes(item.topic))
      : [];
  const diversify = (items: RankedFashionContent[]) => {
    if (!input.preferences.personalized) return items;
    // Prefer a varied first pass without hiding other articles of a theme.
    const seenTopics = new Set<string>();
    const deferred: RankedFashionContent[] = [];
    const varied = items.filter((item) => {
      if (seenTopics.has(item.topicFingerprint)) {
        deferred.push(item);
        return false;
      }
      seenTopics.add(item.topicFingerprint);
      return true;
    });
    return [...varied, ...deferred];
  };
  return [
    ...diversify(preferred).map((item) => ({ ...item, isDiscovery: false })),
    ...diversify(supplemental)
      .slice(0, Math.max(0, 6 - preferred.length))
      .map((item) => ({ ...item, isDiscovery: true })),
  ].slice(0, 12);
}
