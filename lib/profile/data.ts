import { getViewer } from "@/lib/auth/viewer";
import { buildDiaryUtilizationReport } from "@/lib/diary/report";
import { dateInTimeZone, diaryRangeStart } from "@/lib/diary/validation";
import { createClient } from "@/lib/supabase/server";
import { getWardrobeItems } from "@/lib/wardrobe/data";

export type ProfilePageData = {
  stats: { diaryDays: number; itemCount: number; utilizationRate: number };
  viewer: NonNullable<Awaited<ReturnType<typeof getViewer>>>;
};

export async function getProfilePageData(): Promise<ProfilePageData | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const today = dateInTimeZone(
    new Date(),
    viewer.weatherTimezone ?? "Asia/Shanghai",
  );
  const start = diaryRangeStart("30", today);
  const supabase = await createClient();
  const [wardrobeResult, diaryCountResult, diaryResult] = await Promise.all([
    getWardrobeItems({ q: "", status: "active" }),
    supabase
      .from("outfit_diary_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", viewer.userId)
      .lte("worn_on", today),
    supabase
      .from("outfit_diary_entries")
      .select("worn_on, item_ids")
      .eq("user_id", viewer.userId)
      .gte("worn_on", start ?? today)
      .lte("worn_on", today),
  ]);
  if (wardrobeResult.error || diaryCountResult.error || diaryResult.error)
    return null;
  const report = buildDiaryUtilizationReport(
    diaryResult.data ?? [],
    wardrobeResult.items,
  );
  return {
    stats: {
      diaryDays: diaryCountResult.count ?? 0,
      itemCount: wardrobeResult.items.length,
      utilizationRate: report.utilizationRate,
    },
    viewer,
  };
}
