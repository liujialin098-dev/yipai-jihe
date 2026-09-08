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

// Bounded collage slots; never an interactive canvas or a fabricated outfit.
export function homeLookPositions(count: number) {
  const positions =
    count <= 3
      ? [
          { x: 29, y: 38, width: 43, height: 58, rotate: -6 },
          { x: 71, y: 43, width: 39, height: 64, rotate: 6 },
          { x: 48, y: 80, width: 33, height: 28, rotate: -3 },
        ]
      : [
          { x: 28, y: 31, width: 38, height: 47, rotate: -5 },
          { x: 68, y: 41, width: 36, height: 56, rotate: 5 },
          { x: 28, y: 73, width: 33, height: 26, rotate: -4 },
          { x: 74, y: 79, width: 26, height: 29, rotate: 6 },
          { x: 82, y: 13, width: 22, height: 22, rotate: 8 },
          { x: 48, y: 15, width: 20, height: 25, rotate: -3 },
          { x: 49, y: 66, width: 20, height: 23, rotate: 3 },
        ];
  return positions.slice(0, Math.max(0, Math.min(7, count)));
}
