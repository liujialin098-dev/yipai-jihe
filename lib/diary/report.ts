import type { WardrobeItem } from "@/lib/wardrobe/data";

export type DiaryReportEntry = {
  item_ids: string[];
  worn_on: string;
};

export type DiaryItemUtilization = {
  item: WardrobeItem;
  lastWornOn: string | null;
  status: "frequent" | "worn" | "unused";
  wearCount: number;
};

export type DiaryUtilizationReport = {
  activeItemCount: number;
  frequentItems: DiaryItemUtilization[];
  itemWearEvents: number;
  recordedDays: number;
  unusedItems: DiaryItemUtilization[];
  usedItemCount: number;
  utilizationRate: number;
};

export function buildDiaryUtilizationReport(
  entries: DiaryReportEntry[],
  activeItems: WardrobeItem[],
): DiaryUtilizationReport {
  const counts = new Map<string, { count: number; lastWornOn: string }>();

  for (const entry of entries) {
    for (const itemId of new Set(entry.item_ids)) {
      const current = counts.get(itemId);
      counts.set(itemId, {
        count: (current?.count ?? 0) + 1,
        lastWornOn:
          !current || entry.worn_on > current.lastWornOn
            ? entry.worn_on
            : current.lastWornOn,
      });
    }
  }

  const utilization = activeItems.map((item): DiaryItemUtilization => {
    const usage = counts.get(item.id);
    const wearCount = usage?.count ?? 0;
    return {
      item,
      lastWornOn: usage?.lastWornOn ?? null,
      status: wearCount >= 3 ? "frequent" : wearCount > 0 ? "worn" : "unused",
      wearCount,
    };
  });

  const sorted = [...utilization].sort((left, right) => {
    if (right.wearCount !== left.wearCount) {
      return right.wearCount - left.wearCount;
    }
    if (left.lastWornOn !== right.lastWornOn) {
      return (right.lastWornOn ?? "").localeCompare(left.lastWornOn ?? "");
    }
    return left.item.name.localeCompare(right.item.name, "zh-CN");
  });
  const usedItemCount = utilization.filter((item) => item.wearCount > 0).length;
  const activeItemCount = activeItems.length;

  return {
    activeItemCount,
    frequentItems: sorted.filter((item) => item.wearCount > 0),
    itemWearEvents: entries.reduce(
      (total, entry) => total + new Set(entry.item_ids).size,
      0,
    ),
    recordedDays: entries.length,
    unusedItems: sorted.filter((item) => item.wearCount === 0),
    usedItemCount,
    utilizationRate:
      activeItemCount === 0
        ? 0
        : Math.round((usedItemCount / activeItemCount) * 100),
  };
}
