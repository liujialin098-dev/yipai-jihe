import { getViewer } from "@/lib/auth/viewer";
import {
  buildDiaryUtilizationReport,
  type DiaryUtilizationReport,
} from "@/lib/diary/report";
import {
  dateInTimeZone,
  diaryRangeStart,
  isIsoDate,
  monthBounds,
  resolveDiaryMonth,
  type DiaryRange,
} from "@/lib/diary/validation";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  getWardrobeItems,
  getWardrobeItemsByIds,
  type WardrobeItem,
} from "@/lib/wardrobe/data";

type DiaryRow = Tables<"outfit_diary_entries">;

export type DiarySnapshotItem = {
  category: string;
  id: string;
  name: string;
  primaryColor: string;
  style: string;
};

export type DiaryEntryItemView = DiarySnapshotItem & {
  current: WardrobeItem | null;
};

export type DiaryEntryView = Omit<DiaryRow, "outfit_snapshot" | "user_id"> & {
  items: DiaryEntryItemView[];
};

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDiarySnapshot(
  value: Json,
  fallbackIds: string[],
): DiarySnapshotItem[] {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return fallbackIds.map((id) => ({
      category: "",
      id,
      name: "已移除衣物",
      primaryColor: "",
      style: "",
    }));
  }

  const items = value.items.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const name = typeof candidate.name === "string" ? candidate.name : "";
    if (!id || !name) return [];
    return [
      {
        category:
          typeof candidate.category === "string" ? candidate.category : "",
        id,
        name,
        primaryColor:
          typeof candidate.primaryColor === "string"
            ? candidate.primaryColor
            : "",
        style: typeof candidate.style === "string" ? candidate.style : "",
      },
    ];
  });

  return items.length > 0
    ? items
    : fallbackIds.map((id) => ({
        category: "",
        id,
        name: "已移除衣物",
        primaryColor: "",
        style: "",
      }));
}

async function toDiaryViews(rows: DiaryRow[]) {
  const currentItems = await getWardrobeItemsByIds(
    rows.flatMap((row) => row.item_ids),
  );
  const currentMap = new Map(currentItems.map((item) => [item.id, item]));

  return rows.map((row): DiaryEntryView => {
    const { outfit_snapshot: snapshot, user_id: _userId, ...entry } = row;
    return {
      ...entry,
      items: parseDiarySnapshot(snapshot, row.item_ids).map((item) => ({
        ...item,
        current: currentMap.get(item.id) ?? null,
      })),
    };
  });
}

export async function getDiaryMonthData(monthValue: unknown) {
  const viewer = await getViewer();
  if (!viewer) return null;
  const today = dateInTimeZone(
    new Date(),
    viewer.weatherTimezone ?? "Asia/Shanghai",
  );
  const month = resolveDiaryMonth(monthValue, today);
  const bounds = monthBounds(month);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_diary_entries")
    .select("*")
    .eq("user_id", viewer.userId)
    .gte("worn_on", bounds.start)
    .lte("worn_on", bounds.end)
    .order("worn_on", { ascending: false });

  return {
    entries: error || !data ? [] : await toDiaryViews(data),
    error: error ? "穿搭日记暂时无法读取，请稍后重试。" : null,
    month,
    today,
  };
}

export async function getDiaryComposerData(dateValue: unknown) {
  const viewer = await getViewer();
  if (!viewer) return null;
  const today = dateInTimeZone(
    new Date(),
    viewer.weatherTimezone ?? "Asia/Shanghai",
  );
  const requestedDate = typeof dateValue === "string" ? dateValue : "";
  const wornOn =
    isIsoDate(requestedDate) && requestedDate <= today ? requestedDate : today;
  const supabase = await createClient();
  const [entryResult, wardrobeResult] = await Promise.all([
    supabase
      .from("outfit_diary_entries")
      .select("*")
      .eq("user_id", viewer.userId)
      .eq("worn_on", wornOn)
      .maybeSingle(),
    getWardrobeItems({ q: "", status: "active" }),
  ]);

  return {
    entry: entryResult.data ?? null,
    error:
      entryResult.error || wardrobeResult.error
        ? "记录页暂时无法完整读取，请稍后重试。"
        : null,
    items: wardrobeResult.items,
    today,
    wornOn,
  };
}

export async function getDiaryReportData(range: DiaryRange): Promise<{
  error: string | null;
  recentStickerItems: DiaryUtilizationReport["frequentItems"];
  report: DiaryUtilizationReport;
  today: string;
} | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const today = dateInTimeZone(
    new Date(),
    viewer.weatherTimezone ?? "Asia/Shanghai",
  );
  const start = diaryRangeStart(range, today);
  const supabase = await createClient();
  let entriesQuery = supabase
    .from("outfit_diary_entries")
    .select("worn_on, item_ids")
    .eq("user_id", viewer.userId)
    .lte("worn_on", today)
    .order("worn_on", { ascending: false });
  if (start) entriesQuery = entriesQuery.gte("worn_on", start);

  const [entriesResult, wardrobeResult] = await Promise.all([
    entriesQuery,
    getWardrobeItems({ q: "", status: "active" }),
  ]);
  const entries = entriesResult.data ?? [];
  const recentStart = diaryRangeStart("30", today);
  const recentReport = buildDiaryUtilizationReport(
    entries.filter((entry) => !recentStart || entry.worn_on >= recentStart),
    wardrobeResult.items,
  );

  return {
    error:
      entriesResult.error || wardrobeResult.error
        ? "利用率报告暂时无法完整读取，请稍后重试。"
        : null,
    recentStickerItems: recentReport.frequentItems.slice(0, 24),
    report: buildDiaryUtilizationReport(entries, wardrobeResult.items),
    today,
  };
}

export async function getTodayDiarySummary() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const today = dateInTimeZone(
    new Date(),
    viewer.weatherTimezone ?? "Asia/Shanghai",
  );
  const supabase = await createClient();
  const { data } = await supabase
    .from("outfit_diary_entries")
    .select("title, item_ids")
    .eq("user_id", viewer.userId)
    .eq("worn_on", today)
    .maybeSingle();
  return { entry: data ?? null, today };
}
