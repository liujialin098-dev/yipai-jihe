import {
  CANVAS_ITEM_LIMITS,
  type OutfitCanvasItem,
  type OutfitCanvasTheme,
  isOutfitCanvasTheme,
  normalizeCanvasStack,
} from "@/lib/outfits/canvas";
import { isUuid } from "@/lib/wardrobe/validation";

export type OutfitCanvasInput = {
  backgroundTheme: OutfitCanvasTheme;
  canvasId?: string;
  items: OutfitCanvasItem[];
  sourceRecommendationId?: string;
  sourceSlot?: 1 | 2 | 3;
  title: string;
};

export type OutfitCanvasActionState =
  | { status: "idle"; message: "" }
  | { status: "error"; message: string }
  | { status: "success"; message: string; canvasId: string };

export const INITIAL_OUTFIT_CANVAS_ACTION_STATE: OutfitCanvasActionState = {
  status: "idle",
  message: "",
};

function inRange(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function parseCanvasItems(value: unknown): OutfitCanvasItem[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 8) {
    return null;
  }

  const seen = new Set<string>();
  const parsed: OutfitCanvasItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Partial<OutfitCanvasItem>;
    if (
      typeof item.wardrobeItemId !== "string" ||
      !isUuid(item.wardrobeItemId) ||
      seen.has(item.wardrobeItemId) ||
      typeof item.x !== "number" ||
      !inRange(item.x, CANVAS_ITEM_LIMITS.x.min, CANVAS_ITEM_LIMITS.x.max) ||
      typeof item.y !== "number" ||
      !inRange(item.y, CANVAS_ITEM_LIMITS.y.min, CANVAS_ITEM_LIMITS.y.max) ||
      typeof item.scale !== "number" ||
      !inRange(
        item.scale,
        CANVAS_ITEM_LIMITS.scale.min,
        CANVAS_ITEM_LIMITS.scale.max,
      ) ||
      typeof item.rotation !== "number" ||
      !inRange(
        item.rotation,
        CANVAS_ITEM_LIMITS.rotation.min,
        CANVAS_ITEM_LIMITS.rotation.max,
      ) ||
      typeof item.zIndex !== "number" ||
      !Number.isInteger(item.zIndex) ||
      item.zIndex < 1 ||
      item.zIndex > 8
    ) {
      return null;
    }

    seen.add(item.wardrobeItemId);
    parsed.push(item as OutfitCanvasItem);
  }

  return normalizeCanvasStack(parsed);
}

export function validateOutfitCanvasInput(
  value: unknown,
): { success: true; data: OutfitCanvasInput } | { success: false } {
  if (!value || typeof value !== "object") return { success: false };
  const input = value as Partial<OutfitCanvasInput>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const items = parseCanvasItems(input.items);

  if (
    title.length < 1 ||
    title.length > 30 ||
    !isOutfitCanvasTheme(input.backgroundTheme) ||
    !items ||
    (input.canvasId !== undefined && !isUuid(input.canvasId)) ||
    (input.sourceRecommendationId !== undefined &&
      !isUuid(input.sourceRecommendationId)) ||
    (input.sourceSlot !== undefined &&
      input.sourceSlot !== 1 &&
      input.sourceSlot !== 2 &&
      input.sourceSlot !== 3)
  ) {
    return { success: false };
  }

  return {
    success: true,
    data: {
      title,
      backgroundTheme: input.backgroundTheme,
      items,
      ...(input.canvasId ? { canvasId: input.canvasId } : {}),
      ...(input.sourceRecommendationId
        ? { sourceRecommendationId: input.sourceRecommendationId }
        : {}),
      ...(input.sourceSlot ? { sourceSlot: input.sourceSlot } : {}),
    },
  };
}
