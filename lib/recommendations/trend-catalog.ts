import type { RecommendationOccasion } from "@/lib/recommendations/constants";
import type { WardrobeStyle } from "@/lib/wardrobe/constants";

export type TrendInspiration = {
  id: string;
  title: string;
  summary: string;
  style: WardrobeStyle;
  occasions: readonly RecommendationOccasion[];
  publishedAt: string;
  validUntil: string;
  sourceName: string;
  sourceUrl: string;
};

export const TREND_INSPIRATIONS: readonly TrendInspiration[] = [
  {
    id: "fall-2026-tonal-clean",
    title: "同色系的干净层次",
    summary:
      "从上衣到下装使用相邻中性色，再用鞋或包压住轮廓，基础款也会更完整。",
    style: "cleanfit",
    occasions: ["commute", "casual", "date", "formal"],
    publishedAt: "2026-08-19",
    validUntil: "2026-12-31",
    sourceName: "Vogue Fall 2026 Trends",
    sourceUrl: "https://www.vogue.com/article/fall-winter-2026-fashion-trends",
  },
  {
    id: "fall-2026-modern-tailoring",
    title: "柔和结构的现代剪裁",
    summary:
      "用不紧绷的外套搭配利落裤装，保留肩线和腰线，但不做传统套装式的僵硬组合。",
    style: "oldmoney",
    occasions: ["commute", "date", "formal"],
    publishedAt: "2026-08-19",
    validUntil: "2026-12-31",
    sourceName: "Vogue Fall 2026 Trends",
    sourceUrl: "https://www.vogue.com/article/fall-winter-2026-fashion-trends",
  },
  {
    id: "fall-2026-shirt-foundation",
    title: "衬衫作为层次底座",
    summary: "让衬衫领口或下摆露出一小段，再叠针织或外套，正式感会更自然。",
    style: "minimal",
    occasions: ["commute", "date", "formal"],
    publishedAt: "2026-03-18",
    validUntil: "2026-12-31",
    sourceName: "Vogue Fall 2026 Season Report",
    sourceUrl:
      "https://www.vogue.com/article/the-11-fashion-trends-that-defined-the-fall-2026-season",
  },
  {
    id: "fall-2026-color-pop",
    title: "一处高饱和色",
    summary: "全身保留大面积中性色，只让红、绿或黄出现在一件上衣、鞋或配饰上。",
    style: "streetwear",
    occasions: ["casual", "date"],
    publishedAt: "2026-07-24",
    validUntil: "2026-12-31",
    sourceName: "GQ Menswear Color Trends 2026",
    sourceUrl: "https://www.gq.com/story/biggest-color-trends-in-menswear-2026",
  },
  {
    id: "fall-2026-weatherproof-layering",
    title: "城市里的防风层次",
    summary: "功能外层与日常裤装组合，雨天优先防水鞋；机能感只保留一到两处。",
    style: "gorpcore",
    occasions: ["commute", "casual"],
    publishedAt: "2026-02-06",
    validUntil: "2026-12-31",
    sourceName: "Vogue Copenhagen Fall 2026",
    sourceUrl:
      "https://www.vogue.com/article/all-the-trends-and-styling-tips-from-the-fall-2026-copenhagen-shows",
  },
  {
    id: "fall-2026-retro-romanticism",
    title: "复古色与轻松轮廓",
    summary:
      "用带年代感的棕、酒红或旧蓝做主色，搭配宽松外套，避免从头到脚都像戏服。",
    style: "vintage",
    occasions: ["casual", "date"],
    publishedAt: "2026-02-03",
    validUntil: "2026-12-31",
    sourceName: "GQ Fall-Winter 2026 Menswear",
    sourceUrl:
      "https://www.gq.com/story/the-9-fall-winter-2026-menswear-trends-to-try-right-now",
  },
] as const;

export function currentTrendInspirations(
  occasion: RecommendationOccasion,
  now = new Date(),
) {
  const day = now.toISOString().slice(0, 10);
  return TREND_INSPIRATIONS.filter(
    (trend) => trend.validUntil >= day && trend.occasions.includes(occasion),
  ).slice(0, 3);
}
