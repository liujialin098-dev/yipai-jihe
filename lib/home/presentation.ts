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
// 透明衣物在同一区域轻微交叠，不添加独立纸片背景。
export function homeLookPositions(count: number) {
  const size = Number.isFinite(count)
    ? Math.max(0, Math.min(8, Math.floor(count)))
    : 0;
  if (size === 0) return [];
  if (size === 1)
    return [
      { x: 50, y: 50, width: 68, height: 78, rotate: -4 },
    ] satisfies HomePosition[];
  if (size === 2)
    return [
      { x: 33, y: 43, width: 52, height: 66, rotate: -7 },
      { x: 68, y: 59, width: 48, height: 58, rotate: 7 },
    ] satisfies HomePosition[];
  if (size === 3)
    return [
      { x: 32, y: 35, width: 52, height: 58, rotate: -7 },
      { x: 70, y: 53, width: 46, height: 66, rotate: 6 },
      { x: 32, y: 76, width: 48, height: 36, rotate: -6 },
    ] satisfies HomePosition[];
  const positions: HomePosition[] = [
    { x: 32, y: 28, width: 50, height: 48, rotate: -7 },
    { x: 72, y: 27, width: 42, height: 42, rotate: 7 },
    { x: 68, y: 68, width: 46, height: 49, rotate: 5 },
    { x: 26, y: 69, width: 40, height: 42, rotate: -8 },
    { x: 49, y: 84, width: 36, height: 23, rotate: -5 },
    { x: 76, y: 49, width: 32, height: 27, rotate: 9 },
    { x: 20, y: 46, width: 28, height: 29, rotate: -9 },
    { x: 47, y: 50, width: 32, height: 30, rotate: 5 },
  ];
  return positions.slice(0, size);
}
