import type { ClothingPreference } from "@/lib/personalization/constants";
import {
  recommendationOccasionLabel,
  type RecommendationOccasion,
  type RecommendationOutfit,
  type RecommendationWardrobeItem,
  type WeatherSnapshot,
} from "@/lib/recommendations/constants";
import {
  deriveOutfitLayers,
  OUTFIT_LAYER_LABELS,
} from "@/lib/recommendations/layers";
import {
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  STYLE_OPTIONS,
  optionLabel,
} from "@/lib/wardrobe/constants";

const LOOKBOOK_PATH_PATTERN =
  /^([0-9a-f-]{36})\/lookbooks\/([0-9a-f-]{36})\/([123])\.png$/i;

export function lookbookObjectPath(
  userId: string,
  recommendationId: string,
  slot: 1 | 2 | 3,
) {
  return `${userId}/lookbooks/${recommendationId}/${slot}.png`;
}

export function isOwnedLookbookPath(path: string, userId: string) {
  const match = path.match(LOOKBOOK_PATH_PATTERN);
  return Boolean(match && match[1]?.toLowerCase() === userId.toLowerCase());
}

function figureDescription(preference: ClothingPreference) {
  if (preference === "male") {
    return "无可识别面部的男性比例虚拟时装模特，身形自然克制";
  }
  if (preference === "female") {
    return "无可识别面部的女性比例虚拟时装模特，身形自然克制";
  }
  return "无可识别面部的中性比例虚拟时装模特，身形自然克制";
}

export function buildLookbookPrompt({
  clothingPreference,
  items,
  occasion,
  outfit,
  weather,
}: {
  clothingPreference: ClothingPreference;
  items: RecommendationWardrobeItem[];
  occasion: RecommendationOccasion;
  outfit: RecommendationOutfit;
  weather: WeatherSnapshot;
}) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const layers = deriveOutfitLayers(outfit.itemIds, items).flatMap((layer) => {
    const item = itemMap.get(layer.itemId);
    if (!item) return [];
    return [
      {
        role: OUTFIT_LAYER_LABELS[layer.role],
        name: item.name,
        color: optionLabel(COLOR_OPTIONS, item.primary_color),
        material: optionLabel(MATERIAL_OPTIONS, item.material),
        style: optionLabel(STYLE_OPTIONS, item.style),
      },
    ];
  });

  return `为移动端智能衣橱生成一张高端时装电商 Lookbook。\n人物：${figureDescription(clothingPreference)}，全身正面自然站姿，不对应任何真人。\n场景：冷白无缝棚拍背景，柔和银灰地面阴影，Apple 产品摄影般克制、清晰、真实。\n天气与用途：${weather.city}${weather.summary}，体感 ${weather.apparentTemperatureC}°C，${recommendationOccasionLabel(occasion)}。\n穿搭方向：${outfit.styleTags.map((style) => optionLabel(STYLE_OPTIONS, style)).join("、")}。\n必须按以下层次穿在同一个模特身上：${JSON.stringify(layers)}。\n完整展示从头到脚，准确保留清单中的颜色、材质层次和配饰数量。不得新增明显的上装、下装、外套、鞋或配饰，不得出现品牌文字、Logo、价格、标题、水印、购物袋或额外人物。面部保持无身份、低细节，重点展示服装比例。竖版 2:3，高级自然，不做夸张秀场姿势。`;
}

export function parseGeneratedImage(value: unknown) {
  if (!value || typeof value !== "object" || !("data" in value)) return null;
  const data = (value as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  const first = data[0];
  if (!first || typeof first !== "object" || !("b64_json" in first)) {
    return null;
  }
  const encoded = (first as { b64_json?: unknown }).b64_json;
  if (typeof encoded !== "string" || encoded.length < 1_000) return null;
  const image = Buffer.from(encoded, "base64");
  if (image.length < 10_000 || image.length > 12 * 1024 * 1024) return null;
  const isPng =
    image[0] === 0x89 &&
    image[1] === 0x50 &&
    image[2] === 0x4e &&
    image[3] === 0x47;
  return isPng ? image : null;
}
