export const OUTFIT_CANVAS_THEMES = [
  { value: "lime", label: "青柠", color: "#d8ff52", text: "#202124" },
  { value: "lilac", label: "丁香", color: "#afa0ea", text: "#202124" },
  { value: "sky", label: "晴空", color: "#7ccff5", text: "#202124" },
  { value: "coral", label: "珊瑚", color: "#ff8b6b", text: "#202124" },
  { value: "paper", label: "冷白", color: "#f4f5f7", text: "#202124" },
] as const;

export type OutfitCanvasTheme = (typeof OUTFIT_CANVAS_THEMES)[number]["value"];

export type OutfitCanvasItem = {
  wardrobeItemId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
};

export type OutfitCanvasCategory =
  | "accessories"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "tops";

export const OUTFIT_CATEGORY_SCALE: Record<OutfitCanvasCategory, number> = {
  tops: 1,
  bottoms: 1.04,
  dresses: 1.16,
  outerwear: 1.18,
  shoes: 0.76,
  accessories: 0.62,
};

export const CANVAS_ITEM_LIMITS = {
  x: { min: 0.08, max: 0.92 },
  y: { min: 0.16, max: 0.9 },
  scale: { min: 0.55, max: 1.8 },
  rotation: { min: -30, max: 30 },
} as const;

const POSITIONS: Record<number, Array<[number, number]>> = {
  2: [
    [0.36, 0.42],
    [0.65, 0.69],
  ],
  3: [
    [0.35, 0.36],
    [0.66, 0.56],
    [0.38, 0.76],
  ],
  4: [
    [0.32, 0.34],
    [0.66, 0.39],
    [0.35, 0.68],
    [0.7, 0.75],
  ],
  5: [
    [0.28, 0.32],
    [0.62, 0.32],
    [0.42, 0.55],
    [0.72, 0.62],
    [0.31, 0.79],
  ],
  6: [
    [0.26, 0.3],
    [0.58, 0.29],
    [0.76, 0.46],
    [0.38, 0.53],
    [0.25, 0.76],
    [0.65, 0.77],
  ],
  7: [
    [0.24, 0.29],
    [0.53, 0.28],
    [0.77, 0.4],
    [0.37, 0.48],
    [0.66, 0.6],
    [0.26, 0.77],
    [0.62, 0.82],
  ],
  8: [
    [0.22, 0.28],
    [0.49, 0.27],
    [0.77, 0.34],
    [0.32, 0.48],
    [0.65, 0.53],
    [0.81, 0.69],
    [0.26, 0.76],
    [0.58, 0.82],
  ],
};

const ROTATIONS = [-6, 4, -2, 7, -5, 2, -8, 5] as const;

export function isOutfitCanvasTheme(
  value: unknown,
): value is OutfitCanvasTheme {
  return OUTFIT_CANVAS_THEMES.some((theme) => theme.value === value);
}

export function outfitCanvasTheme(value: OutfitCanvasTheme) {
  return (
    OUTFIT_CANVAS_THEMES.find((theme) => theme.value === value) ??
    OUTFIT_CANVAS_THEMES[0]
  );
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampCanvasItem(item: OutfitCanvasItem): OutfitCanvasItem {
  return {
    ...item,
    x: clampNumber(item.x, CANVAS_ITEM_LIMITS.x.min, CANVAS_ITEM_LIMITS.x.max),
    y: clampNumber(item.y, CANVAS_ITEM_LIMITS.y.min, CANVAS_ITEM_LIMITS.y.max),
    scale: clampNumber(
      item.scale,
      CANVAS_ITEM_LIMITS.scale.min,
      CANVAS_ITEM_LIMITS.scale.max,
    ),
    rotation: clampNumber(
      item.rotation,
      CANVAS_ITEM_LIMITS.rotation.min,
      CANVAS_ITEM_LIMITS.rotation.max,
    ),
  };
}

export function createInitialCanvasItems(
  wardrobeItemIds: string[],
  categoryById: ReadonlyMap<string, string> = new Map(),
): OutfitCanvasItem[] {
  const ids = [...new Set(wardrobeItemIds)].slice(0, 8);
  const count = Math.max(2, ids.length);
  const positions = POSITIONS[count] ?? POSITIONS[8];
  const baseScale = count <= 3 ? 1.08 : count <= 5 ? 0.9 : 0.75;

  return ids.map((wardrobeItemId, index) => {
    const category = categoryById.get(wardrobeItemId);
    const categoryScale = isOutfitCanvasCategory(category)
      ? OUTFIT_CATEGORY_SCALE[category]
      : 1;
    return {
      wardrobeItemId,
      x: positions[index]?.[0] ?? 0.5,
      y: positions[index]?.[1] ?? 0.5,
      scale: clampNumber(
        baseScale * categoryScale,
        CANVAS_ITEM_LIMITS.scale.min,
        CANVAS_ITEM_LIMITS.scale.max,
      ),
      rotation: ROTATIONS[index] ?? 0,
      zIndex: index + 1,
    };
  });
}

function isOutfitCanvasCategory(
  value: string | undefined,
): value is OutfitCanvasCategory {
  return Boolean(value && value in OUTFIT_CATEGORY_SCALE);
}

export function normalizeCanvasStack(
  items: OutfitCanvasItem[],
): OutfitCanvasItem[] {
  return [...items]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((item, index) => ({ ...item, zIndex: index + 1 }));
}
