/** Date-only UTC arithmetic keeps the strip stable across server timezones. */
export function recentHomeDays(today: string) {
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (4 - index));
    return date.toISOString().slice(0, 10);
  });
}

export function homeDiaryItem<T extends { id: string }>(
  itemIds: string[],
  items: T[],
  favoriteIds: string[],
): T | null {
  const visible = itemIds.flatMap((id) => {
    const item = items.find((candidate) => candidate.id === id);
    return item ? [item] : [];
  });
  return (
    visible.find((item) => favoriteIds.includes(item.id)) ?? visible[0] ?? null
  );
}

/** 仅展示已就绪透明贴纸，不用普通照片冒充抠图；不是搭配算法。 */
export function homePreviewItems<
  T extends { id: string; category: string; cutoutUrl: string | null },
>(items: T[]): T[] {
  const categories = new Set<string>();
  const ids = new Set<string>();
  const first: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (!item.cutoutUrl) continue;
    if (ids.has(item.id)) continue;
    ids.add(item.id);
    if (!categories.has(item.category)) {
      categories.add(item.category);
      first.push(item);
    } else rest.push(item);
  }
  return [...first, ...rest].slice(0, 8);
}

type HomePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
};
// 深色画板使用杂志拼贴式满铺：边缘允许裁切，中心单品前置，避免退回均匀格子。
export function homeLookPositions(count: number) {
  const size = Number.isFinite(count)
    ? Math.max(0, Math.min(8, Math.floor(count)))
    : 0;
  if (size === 0) return [];
  if (size === 1)
    return [
      { x: 50, y: 50, width: 86, height: 88, rotate: -3 },
    ] satisfies HomePosition[];
  if (size === 2)
    return [
      { x: 29, y: 43, width: 72, height: 78, rotate: -8 },
      { x: 70, y: 58, width: 72, height: 78, rotate: 7 },
    ] satisfies HomePosition[];
  if (size === 3)
    return [
      { x: 22, y: 30, width: 66, height: 68, rotate: -8 },
      { x: 79, y: 34, width: 66, height: 70, rotate: 7 },
      { x: 51, y: 72, width: 78, height: 74, rotate: -3 },
    ] satisfies HomePosition[];
  const positions: HomePosition[] = [
    { x: 14, y: 18, width: 62, height: 62, rotate: -9 },
    { x: 54, y: 13, width: 64, height: 60, rotate: 5 },
    { x: 91, y: 25, width: 56, height: 62, rotate: 9 },
    { x: 12, y: 59, width: 62, height: 66, rotate: 7 },
    { x: 89, y: 64, width: 60, height: 66, rotate: -8 },
    { x: 27, y: 92, width: 62, height: 58, rotate: -5 },
    { x: 73, y: 92, width: 64, height: 58, rotate: 6 },
    { x: 52, y: 54, width: 78, height: 80, rotate: -2 },
  ];
  return positions.slice(0, size);
}
