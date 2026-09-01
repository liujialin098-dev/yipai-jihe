import { getViewer } from "@/lib/auth/viewer";
import { buildDiaryUtilizationReport } from "@/lib/diary/report";
import { dateInTimeZone, diaryRangeStart } from "@/lib/diary/validation";
import {
  isOutfitCanvasTheme,
  type OutfitCanvasItem,
  type OutfitCanvasTheme,
} from "@/lib/outfits/canvas";
import { parseCanvasItems } from "@/lib/outfits/validation";
import { createClient } from "@/lib/supabase/server";
import {
  getWardrobeItems,
  getWardrobeItemsByIds,
  type WardrobeItem,
} from "@/lib/wardrobe/data";

export type ProfileCanvasSummary = {
  id: string;
  items: OutfitCanvasItem[];
  theme: OutfitCanvasTheme;
  title: string;
  wardrobeItems: WardrobeItem[];
};

export type ProfilePageData = {
  canvases: ProfileCanvasSummary[];
  stats: {
    canvasCount: number;
    diaryDays: number;
    itemCount: number;
    utilizationRate: number;
  };
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
  const [
    wardrobeResult,
    canvasCountResult,
    diaryCountResult,
    diaryResult,
    recentResult,
  ] = await Promise.all([
    getWardrobeItems({ q: "", status: "active" }),
    supabase
      .from("outfit_canvases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", viewer.userId),
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
    supabase
      .from("outfit_canvases")
      .select("id, title, background_theme, items")
      .eq("user_id", viewer.userId)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const parsedCanvases = (recentResult.data ?? []).flatMap((row) => {
    const items = parseCanvasItems(row.items);
    return items
      ? [
          {
            id: row.id,
            items,
            theme: isOutfitCanvasTheme(row.background_theme)
              ? row.background_theme
              : ("lime" as const),
            title: row.title,
          },
        ]
      : [];
  });
  const wardrobeItems = await getWardrobeItemsByIds(
    parsedCanvases.flatMap((canvas) =>
      canvas.items.map((item) => item.wardrobeItemId),
    ),
  );
  const wardrobeMap = new Map(wardrobeItems.map((item) => [item.id, item]));
  const canvases = parsedCanvases.flatMap((canvas) => {
    const availableItems = canvas.items.filter((item) =>
      wardrobeMap.has(item.wardrobeItemId),
    );
    if (availableItems.length < 2) return [];
    return [
      {
        ...canvas,
        items: availableItems,
        wardrobeItems: availableItems.flatMap((item) => {
          const wardrobeItem = wardrobeMap.get(item.wardrobeItemId);
          return wardrobeItem ? [wardrobeItem] : [];
        }),
      },
    ];
  });
  const report = buildDiaryUtilizationReport(
    diaryResult.data ?? [],
    wardrobeResult.items,
  );

  return {
    canvases,
    stats: {
      canvasCount: canvasCountResult.count ?? 0,
      diaryDays: diaryCountResult.count ?? 0,
      itemCount: wardrobeResult.items.length,
      utilizationRate: report.utilizationRate,
    },
    viewer,
  };
}
