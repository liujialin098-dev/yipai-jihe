import type { RssFashionEntry } from "@/lib/inspiration/rss";
import type {
  FashionContentItem,
  FashionTopic,
} from "@/lib/inspiration/validation";
import type { RecommendationOccasion } from "@/lib/recommendations/constants";
import type { WardrobeStyle } from "@/lib/wardrobe/constants";

const DAY_MS = 86_400_000;
const FASHION_WORDS =
  /\b(outfits?|wear|menswear|womenswear|dress(?:es)?|shirts?|shoes?|sneakers?|bags?|coats?|jackets?|denim|jeans?|pants|trousers?|skirts?|colou?rs?|trends?|wardrobe|tailor(?:ing)?|knit(?:wear|s)?|boots?|loafers?|sandals?|clogs?|sweaters?|cardigans?|blazers?|suits?|streetwear|layering|fashion|street style|runway|ready-to-wear|accessories|jewel(?:l)?ery|necklaces?|earrings?|bracelets?|belts?|scarves?|sunglasses?)\b/i;
const EXCLUDED_WORDS =
  /\b(health|beauty|makeup|skin|hair|movies?|music|politics?|recipes?|food|travel|bridal|weddings?|on-court|power player|sales?|deals?|discounts?)\b/i;

export type FashionImpression = {
  topic_key: string;
  content_id: string;
  first_seen_at: string;
};

export function classify(title: string): {
  topic: FashionTopic;
  styles: WardrobeStyle[];
  occasions: RecommendationOccasion[];
} {
  const value = title.toLowerCase();
  if (/\b(rain|rainy|waterproof|weather|storm)\b/.test(value)) {
    return {
      topic: "weather",
      styles: ["gorpcore", "casual"],
      occasions: ["commute", "casual"],
    };
  }
  if (/\b(colors?|palette|red|blue|green|brown|yellow)\b/.test(value)) {
    return {
      topic: "color",
      styles: ["streetwear", "cleanfit"],
      occasions: ["casual", "date"],
    };
  }
  if (/\b(office|work|tailoring|suits?|formal)\b/.test(value)) {
    return {
      topic: "occasion",
      styles: ["commute", "oldmoney", "minimal"],
      occasions: ["commute", "formal"],
    };
  }
  if (/\b(fall|winter|spring|summer|season|layering)\b/.test(value)) {
    return {
      topic: "seasonal",
      styles: ["minimal", "casual"],
      occasions: ["commute", "casual", "date"],
    };
  }
  if (/\b(streetwear|street style|skatewear|urban style)\b/.test(value)) {
    return {
      topic: "street",
      styles: ["streetwear", "casual"],
      occasions: ["casual", "date"],
    };
  }
  if (
    /\b(accessor(?:y|ies)|jewel(?:l)?ery|necklaces?|earrings?|bracelets?|belts?|scarves?|sunglasses?|handbags?|bags?)\b/.test(
      value,
    )
  ) {
    return {
      topic: "accessory",
      styles: ["minimal", "casual"],
      occasions: ["commute", "casual", "date"],
    };
  }
  if (
    /dress|shirt|shoes?|sneakers?|bag|coat|jacket|denim|jeans?|pants|trouser|skirt|knit|boot|loafer|sandal|clog|sweater|cardigan|blazer|accessories/.test(
      value,
    )
  ) {
    return {
      topic: "item",
      styles: ["casual", "minimal"],
      occasions: ["commute", "casual", "date"],
    };
  }
  return {
    topic: "trend",
    styles: ["casual", "streetwear"],
    occasions: ["casual", "date"],
  };
}

export function fingerprint(title: string) {
  // Topic identity is independent of publisher, date and promotional wording.
  const value = title.toLowerCase();
  const subject = [
    ["denim", /\b(denim|jeans?)\b/],
    ["footwear", /\b(shoes?|sneakers?|boots?|loafers?|sandals?)\b/],
    ["outerwear", /\b(coats?|jackets?|parkas?)\b/],
    ["tailoring", /\b(suits?|tailoring|blazers?)\b/],
    ["knitwear", /\b(knitwear|knits?|sweaters?|cardigans?)\b/],
    ["bag", /\b(bags?|handbags?)\b/],
    ["dress", /\b(dresses|dress|skirts?)\b/],
    ["shirt", /\b(shirts?|t-shirts?)\b/],
  ] as const;
  const direction = /\b(rain|rainy|waterproof)\b/.test(value)
    ? "rain"
    : (/\b(red|blue|green|brown|yellow|pink)\b/.exec(value)?.[0] ??
      /\b(winter|summer|spring|fall)\b/.exec(value)?.[0] ??
      "general");
  const match = subject.find(([, pattern]) => pattern.test(value));
  if (match) return `${match[0]}-${direction}`;
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "with",
            "that",
            "this",
            "your",
            "from",
            "what",
            "best",
            "style",
            "fashion",
          ].includes(word),
      )
      .slice(0, 5)
      .sort()
      .join("-") || title.toLowerCase().slice(0, 40)
  );
}

function chineseSummary(topic: FashionTopic) {
  const summaries: Record<FashionTopic, string> = {
    trend:
      "这条趋势值得先看轮廓和搭配关系，再从自己的衣橱里找相近单品尝试，不必照单购买。",
    color:
      "先保留大面积基础色，再把报道中的颜色放到一件单品或配饰上，更容易穿进日常。",
    item: "重点不是拥有同款，而是观察这件单品与上下装、鞋包之间的比例，再用已有衣物复现。",
    occasion:
      "可以把报道里的搭配逻辑换成自己衣橱中的同类单品，并按实际场合调整正式程度。",
    seasonal:
      "换季时先处理层次和体感，再参考趋势细节；天气不合适时不要为了造型勉强叠穿。",
    weather:
      "先满足防雨、保暖或透气，再用颜色与轮廓保持整体感；实际天气始终优先于趋势。",
    street: "从街头造型观察轮廓与比例，再用自己的单品尝试。",
    accessory: "观察配饰与衣服之间的色彩、材质和大小关系。",
  };
  return summaries[topic];
}

export function fromRss(
  entry: RssFashionEntry,
  now: Date,
): FashionContentItem | null {
  if (!FASHION_WORDS.test(entry.title) || EXCLUDED_WORDS.test(entry.title))
    return null;
  const published = new Date(entry.publishedAt);
  if (
    !Number.isFinite(published.getTime()) ||
    published.getTime() > now.getTime() ||
    published.getTime() < now.getTime() - 30 * DAY_MS
  )
    return null;
  const classified = classify(entry.title);
  return {
    ...entry,
    summaryKind: "reading-guide",
    originalTitle: entry.title,
    summary: chineseSummary(classified.topic),
    topic: classified.topic,
    styles: classified.styles,
    occasions: classified.occasions,
    validUntil: new Date(published.getTime() + 30 * DAY_MS).toISOString(),
    topicFingerprint: fingerprint(entry.title),
  };
}

export function dedupeFashionContent(items: FashionContentItem[]) {
  const sorted = [...items].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  return sorted.filter((item) => {
    // A category such as outerwear is a ranking signal, not article identity.
    const title = (item.originalTitle ?? item.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
    if (seenIds.has(item.id) || seenTitles.has(title)) return false;
    seenIds.add(item.id);
    seenTitles.add(title);
    return true;
  });
}
