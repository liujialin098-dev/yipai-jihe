import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StickerStudio } from "@/components/stickers/sticker-studio";
import { getViewer } from "@/lib/auth/viewer";
import { monthBounds, resolveDiaryMonth } from "@/lib/diary/validation";
import { createClient } from "@/lib/supabase/server";
import { getWardrobeItems } from "@/lib/wardrobe/data";

export const metadata: Metadata = { title: "衣物贴纸册" };

function localDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date());
}

export default async function StickersPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    view?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const supabase = await createClient();
  const today = localDate(viewer.weatherTimezone ?? "Asia/Shanghai");
  const month = resolveDiaryMonth(params.month, today);
  const bounds = monthBounds(month);
  const [wardrobe, favorites, diary] = await Promise.all([
    getWardrobeItems({ q: "", status: "active" }),
    supabase
      .from("wardrobe_item_favorites")
      .select("wardrobe_item_id")
      .eq("user_id", viewer.userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("outfit_diary_entries")
      .select("worn_on, item_ids")
      .eq("user_id", viewer.userId)
      .gte("worn_on", bounds.start)
      .lte("worn_on", bounds.end)
      .order("worn_on", { ascending: true }),
  ]);

  return (
    <StickerStudio
      canvasStorageKey={`ensemble:sticker-canvas:${viewer.shortId}:${today}`}
      day={today}
      error={
        wardrobe.error ??
        (favorites.error
          ? "收藏暂时无法读取，仍可从全部衣物选择。"
          : diary.error
            ? "本月贴纸日历暂时无法读取。"
            : null)
      }
      favoriteIds={(favorites.data ?? []).map(
        (favorite) => favorite.wardrobe_item_id,
      )}
      initialView={params.view === "calendar" ? "calendar" : "canvas"}
      items={wardrobe.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        cutoutUrl: item.cutoutUrl,
      }))}
      month={month}
      monthEntries={(diary.data ?? []).map((entry) => ({
        itemIds: entry.item_ids,
        wornOn: entry.worn_on,
      }))}
      storageKey={`ensemble:sticker-studio:${viewer.shortId}:${today}`}
      today={today}
    />
  );
}
