import { clampStickerCrop, type StickerCrop } from "./canvas";

export function cropFromPointerDelta(
  crop: StickerCrop,
  edge: keyof StickerCrop,
  dx: number,
  dy: number,
  rotation: number,
  size: number,
): StickerCrop {
  if (![dx, dy, rotation, size].every(Number.isFinite) || size <= 0)
    return { ...crop };
  const angle = (rotation * Math.PI) / 180;
  const x = (dx * Math.cos(angle) + dy * Math.sin(angle)) / size;
  const y = (-dx * Math.sin(angle) + dy * Math.cos(angle)) / size;
  const delta =
    edge === "left" ? x : edge === "right" ? -x : edge === "top" ? y : -y;
  return clampStickerCrop({ ...crop, [edge]: crop[edge] + delta });
}
