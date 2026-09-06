"use server";

import type {
  OutfitCanvasActionState,
  OutfitCanvasInput,
} from "@/lib/outfits/validation";

// SDD-030：兼容旧客户端，但不再执行画布或抠图写入。历史资产保持原样。
export async function saveWardrobeCutout(
  _wardrobeItemId: string,
  _storagePath: string,
): Promise<
  | { status: "success"; message: string; cutoutUrl: string }
  | { status: "error"; message: string }
> {
  return { status: "error", message: "抠图功能已停用，原图仍然保留。" };
}

export async function saveOutfitCanvas(
  _input: OutfitCanvasInput,
): Promise<OutfitCanvasActionState> {
  return { status: "error", message: "穿搭卡片已停用，请到推荐页查看搭配。" };
}
