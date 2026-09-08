export const STICKER_CANVAS_THEMES = [
  {
    value: "lilac",
    label: "丁香",
    tone: "light",
    color: "#d8cbea",
    endColor: "#f7f3fb",
    accentColor: "#e8f6a7",
    text: "#27222d",
  },
  {
    value: "lime",
    label: "青柠",
    tone: "light",
    color: "#e5f69b",
    endColor: "#f9fbe9",
    accentColor: "#d8cbea",
    text: "#24271c",
  },
  {
    value: "sky",
    label: "晴空",
    tone: "light",
    color: "#c5e8f7",
    endColor: "#f2f9fc",
    accentColor: "#d8cbea",
    text: "#20272b",
  },
  {
    value: "coral",
    label: "珊瑚",
    tone: "light",
    color: "#ffd0c3",
    endColor: "#fff5f1",
    accentColor: "#e6d4f2",
    text: "#2e2320",
  },
  {
    value: "paper",
    label: "冷白",
    tone: "light",
    color: "#f5f4f2",
    endColor: "#ffffff",
    accentColor: "#ded1ec",
    text: "#252527",
  },
  {
    value: "plum",
    label: "夜紫",
    tone: "dark",
    color: "#4a3857",
    endColor: "#211a28",
    accentColor: "#637147",
    text: "#fffaff",
  },
  {
    value: "midnight",
    label: "午夜",
    tone: "dark",
    color: "#31384f",
    endColor: "#151927",
    accentColor: "#31566a",
    text: "#f8f9ff",
  },
  {
    value: "forest",
    label: "深林",
    tone: "dark",
    color: "#35483d",
    endColor: "#18231d",
    accentColor: "#536540",
    text: "#f7fff9",
  },
  {
    value: "espresso",
    label: "浓咖",
    tone: "dark",
    color: "#513e39",
    endColor: "#241b1a",
    accentColor: "#6c4d43",
    text: "#fff9f6",
  },
] as const;

export type StickerCanvasTheme =
  (typeof STICKER_CANVAS_THEMES)[number]["value"];

export type StickerCanvasItem = {
  wardrobeItemId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  crop: StickerCrop;
};

export type StickerCrop = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const EMPTY_STICKER_CROP: StickerCrop = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const STICKER_CANVAS_LIMITS = {
  x: { min: 0.06, max: 0.94 },
  y: { min: 0.16, max: 0.92 },
  scale: { min: 0.45, max: 2.1 },
  rotation: { min: -180, max: 180 },
} as const;

const POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[0.5, 0.55]],
  2: [
    [0.36, 0.4],
    [0.64, 0.67],
  ],
  3: [
    [0.35, 0.34],
    [0.66, 0.52],
    [0.38, 0.76],
  ],
  4: [
    [0.31, 0.32],
    [0.67, 0.38],
    [0.37, 0.67],
    [0.7, 0.76],
  ],
  5: [
    [0.28, 0.3],
    [0.64, 0.3],
    [0.46, 0.53],
    [0.72, 0.65],
    [0.29, 0.78],
  ],
  6: [
    [0.25, 0.29],
    [0.57, 0.28],
    [0.76, 0.46],
    [0.37, 0.52],
    [0.25, 0.76],
    [0.64, 0.77],
  ],
  7: [
    [0.23, 0.28],
    [0.52, 0.27],
    [0.77, 0.39],
    [0.36, 0.48],
    [0.66, 0.6],
    [0.25, 0.77],
    [0.62, 0.82],
  ],
  8: [
    [0.22, 0.27],
    [0.49, 0.27],
    [0.77, 0.34],
    [0.31, 0.47],
    [0.64, 0.52],
    [0.8, 0.7],
    [0.25, 0.76],
    [0.57, 0.82],
  ],
};

const CATEGORY_SCALE: Record<string, number> = {
  tops: 1,
  bottoms: 1.02,
  dresses: 1.12,
  outerwear: 1.14,
  shoes: 0.76,
  accessories: 0.64,
};

const ROTATIONS = [-7, 5, -3, 8, -5, 3, -9, 6] as const;

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function isStickerCanvasTheme(
  value: unknown,
): value is StickerCanvasTheme {
  return STICKER_CANVAS_THEMES.some((theme) => theme.value === value);
}

export function stickerCanvasTheme(value: StickerCanvasTheme) {
  return (
    STICKER_CANVAS_THEMES.find((theme) => theme.value === value) ??
    STICKER_CANVAS_THEMES[0]
  );
}

export function clampStickerCanvasItem(
  item: StickerCanvasItem,
): StickerCanvasItem {
  return {
    ...item,
    x: clampNumber(
      item.x,
      STICKER_CANVAS_LIMITS.x.min,
      STICKER_CANVAS_LIMITS.x.max,
    ),
    y: clampNumber(
      item.y,
      STICKER_CANVAS_LIMITS.y.min,
      STICKER_CANVAS_LIMITS.y.max,
    ),
    scale: clampNumber(
      item.scale,
      STICKER_CANVAS_LIMITS.scale.min,
      STICKER_CANVAS_LIMITS.scale.max,
    ),
    rotation: clampNumber(
      item.rotation,
      STICKER_CANVAS_LIMITS.rotation.min,
      STICKER_CANVAS_LIMITS.rotation.max,
    ),
    zIndex: Math.max(1, Math.round(item.zIndex)),
    crop: clampStickerCrop(item.crop),
  };
}

export function clampStickerCrop(crop: Partial<StickerCrop> | undefined) {
  const safe = (value: number | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  const next = {
    top: clampNumber(safe(crop?.top), 0, 0.4),
    right: clampNumber(safe(crop?.right), 0, 0.4),
    bottom: clampNumber(safe(crop?.bottom), 0, 0.4),
    left: clampNumber(safe(crop?.left), 0, 0.4),
  };
  if (next.top + next.bottom > 0.72) {
    next.bottom = 0.72 - next.top;
  }
  if (next.left + next.right > 0.72) {
    next.right = 0.72 - next.left;
  }
  return next;
}

export function normalizeStickerStack(items: StickerCanvasItem[]) {
  return [...items]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((item, index) => ({ ...item, zIndex: index + 1 }));
}

function reindexStickerStack(items: StickerCanvasItem[]) {
  return items.map((item, index) => ({ ...item, zIndex: index + 1 }));
}

export function moveStickerLayer(
  items: StickerCanvasItem[],
  wardrobeItemId: string,
  direction: "front" | "back",
) {
  const ordered = [...items].sort((left, right) => left.zIndex - right.zIndex);
  const selected = ordered.find(
    (item) => item.wardrobeItemId === wardrobeItemId,
  );
  if (!selected) return normalizeStickerStack(items);
  const rest = ordered.filter((item) => item.wardrobeItemId !== wardrobeItemId);
  return reindexStickerStack(
    direction === "front" ? [...rest, selected] : [selected, ...rest],
  );
}

export function createInitialStickerCanvasItems(
  wardrobeItemIds: string[],
  categoryById: ReadonlyMap<string, string> = new Map(),
) {
  const ids = [...new Set(wardrobeItemIds)].slice(0, 8);
  const positions = POSITIONS[Math.max(1, ids.length)] ?? POSITIONS[8];
  const baseScale = ids.length <= 2 ? 1.18 : ids.length <= 4 ? 0.98 : 0.78;

  return ids.map(
    (wardrobeItemId, index): StickerCanvasItem => ({
      wardrobeItemId,
      x: positions[index]?.[0] ?? 0.5,
      y: positions[index]?.[1] ?? 0.55,
      scale: clampNumber(
        baseScale *
          (CATEGORY_SCALE[categoryById.get(wardrobeItemId) ?? ""] ?? 1),
        STICKER_CANVAS_LIMITS.scale.min,
        STICKER_CANVAS_LIMITS.scale.max,
      ),
      rotation: ROTATIONS[index] ?? 0,
      zIndex: index + 1,
      crop: { ...EMPTY_STICKER_CROP },
    }),
  );
}

export function reconcileStickerCanvasItems(
  current: StickerCanvasItem[],
  wardrobeItemIds: string[],
  categoryById: ReadonlyMap<string, string> = new Map(),
) {
  const defaults = createInitialStickerCanvasItems(
    wardrobeItemIds,
    categoryById,
  );
  const currentMap = new Map(
    current.map((item) => [item.wardrobeItemId, clampStickerCanvasItem(item)]),
  );
  return normalizeStickerStack(
    defaults.map((item) => currentMap.get(item.wardrobeItemId) ?? item),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseStoredStickerCanvas(
  value: unknown,
  availableIds: ReadonlySet<string>,
) {
  if (
    !isRecord(value) ||
    (value.version !== 1 && value.version !== 2) ||
    !Array.isArray(value.items)
  ) {
    return { items: [] as StickerCanvasItem[], theme: null };
  }
  const seen = new Set<string>();
  const items = value.items.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    const wardrobeItemId = candidate.wardrobeItemId;
    if (
      typeof wardrobeItemId !== "string" ||
      !availableIds.has(wardrobeItemId) ||
      seen.has(wardrobeItemId)
    ) {
      return [];
    }
    const numbers = [
      candidate.x,
      candidate.y,
      candidate.scale,
      candidate.rotation,
      candidate.zIndex,
    ];
    if (
      numbers.some(
        (number) => typeof number !== "number" || !Number.isFinite(number),
      )
    ) {
      return [];
    }
    seen.add(wardrobeItemId);
    return [
      clampStickerCanvasItem({
        wardrobeItemId,
        x: candidate.x as number,
        y: candidate.y as number,
        scale: candidate.scale as number,
        rotation: candidate.rotation as number,
        zIndex: candidate.zIndex as number,
        crop:
          value.version === 2 && isRecord(candidate.crop)
            ? {
                top: Number(candidate.crop.top),
                right: Number(candidate.crop.right),
                bottom: Number(candidate.crop.bottom),
                left: Number(candidate.crop.left),
              }
            : { ...EMPTY_STICKER_CROP },
      }),
    ];
  });

  return {
    items: normalizeStickerStack(items.slice(0, 8)),
    theme: isStickerCanvasTheme(value.theme) ? value.theme : null,
  };
}
