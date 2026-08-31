import type { RecommendationWardrobeItem } from "@/lib/recommendations/constants";
import type { Category, Material } from "@/lib/wardrobe/constants";

export const OUTFIT_LAYER_LIMITS = {
  tops: 2,
  bottoms: 1,
  dresses: 1,
  outerwear: 1,
  shoes: 1,
  accessories: 2,
} satisfies Record<Category, number>;

export type OutfitLayerRole =
  | "base"
  | "main"
  | "outerwear"
  | "bottom"
  | "dress"
  | "shoes"
  | "accessory";

export type OutfitLayer = {
  itemId: string;
  role: OutfitLayerRole;
};

const ROLE_ORDER: OutfitLayerRole[] = [
  "base",
  "main",
  "dress",
  "outerwear",
  "bottom",
  "shoes",
  "accessory",
];

const BASE_MATERIAL_ORDER: Material[] = [
  "silk",
  "cotton",
  "linen",
  "knit",
  "synthetic",
  "denim",
  "wool",
  "leather",
];

export const OUTFIT_LAYER_LABELS: Record<OutfitLayerRole, string> = {
  base: "内搭",
  main: "主上装",
  outerwear: "外套",
  bottom: "下装",
  dress: "连衣裙",
  shoes: "鞋履",
  accessory: "配饰",
};

function baseMaterialScore(material: Material) {
  const index = BASE_MATERIAL_ORDER.indexOf(material);
  return index === -1 ? BASE_MATERIAL_ORDER.length : index;
}

export function deriveOutfitLayers(
  itemIds: string[],
  items: RecommendationWardrobeItem[],
): OutfitLayer[] {
  const order = new Map(itemIds.map((id, index) => [id, index]));
  const selected = itemIds.flatMap((id) => {
    const item = items.find((candidate) => candidate.id === id);
    return item ? [item] : [];
  });
  const tops = selected
    .filter((item) => item.category === "tops")
    .sort(
      (a, b) =>
        baseMaterialScore(a.material) - baseMaterialScore(b.material) ||
        (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
  const baseTopId = tops.length > 1 ? tops[0]?.id : null;

  return selected
    .map((item): OutfitLayer => {
      if (item.category === "tops") {
        return {
          itemId: item.id,
          role: item.id === baseTopId ? "base" : "main",
        };
      }
      const roleByCategory: Record<
        Exclude<Category, "tops">,
        OutfitLayerRole
      > = {
        accessories: "accessory",
        bottoms: "bottom",
        dresses: "dress",
        outerwear: "outerwear",
        shoes: "shoes",
      };
      return { itemId: item.id, role: roleByCategory[item.category] };
    })
    .sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
        (order.get(a.itemId) ?? 0) - (order.get(b.itemId) ?? 0),
    );
}

export function hasValidLayerCounts(items: RecommendationWardrobeItem[]) {
  const counts = new Map<Category, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return (
    Object.entries(OUTFIT_LAYER_LIMITS) as Array<[Category, number]>
  ).every(([category, limit]) => (counts.get(category) ?? 0) <= limit);
}
