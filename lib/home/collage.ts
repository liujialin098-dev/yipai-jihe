import { homeLookPositions, homePreviewItems } from "./presentation";

export type CollageSource = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  cutoutUrl: string | null;
};
export type CollagePiece = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  scale: number;
};
export const homeCollageKey = (viewerId: string) =>
  `ensemble-home-collage-v1:${viewerId}`;
export function bound(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}
export function defaultCollage(items: CollageSource[]): CollagePiece[] {
  const chosen = homePreviewItems(items);
  return homeLookPositions(chosen.length).map((position, index) => ({
    id: chosen[index].id,
    ...position,
    scale: 1,
  }));
}
export function restoreCollage(
  value: unknown,
  items: CollageSource[],
): CollagePiece[] {
  const fallback = defaultCollage(items);
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    typeof value.version !== "number" ||
    ![1, 2].includes(Number(value.version)) ||
    !("pieces" in value) ||
    !Array.isArray(value.pieces)
  )
    return fallback;
  const allowed = new Set(
    items.filter((item) => item.cutoutUrl).map((item) => item.id),
  );
  const seen = new Set<string>();
  const result: CollagePiece[] = [];
  const legacyIds: string[] = [];
  for (const p of value.pieces.slice(0, 64)) {
    if (
      !p ||
      typeof p !== "object" ||
      typeof p.id !== "string" ||
      !allowed.has(p.id) ||
      seen.has(p.id)
    )
      continue;
    seen.add(p.id);
    if (value.version === 1) {
      legacyIds.push(p.id);
      if (legacyIds.length === 8) break;
      continue;
    }
    result.push({
      id: p.id,
      x: bound(p.x, 8, 92, 50),
      y: bound(p.y, 8, 92, 50),
      width: bound(p.width, 20, 86, 42),
      height: bound(p.height, 20, 88, 48),
      rotate: bound(p.rotate, -180, 180, 0),
      scale: bound(p.scale, 0.5, 1.6, 1),
    });
    if (result.length === 8) break;
  }
  if (legacyIds.length) {
    return homeLookPositions(legacyIds.length).map((position, index) => ({
      id: legacyIds[index],
      ...position,
      scale: 1,
    }));
  }
  return result.length ? result : fallback;
}
