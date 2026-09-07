import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StickerStudio } from "@/components/stickers/sticker-studio";
import { getViewer } from "@/lib/auth/viewer";
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

export default async function StickersPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const supabase = await createClient();
  const [wardrobe, favorites] = await Promise.all([
    getWardrobeItems({ q: "", status: "active" }),
    supabase
      .from("wardrobe_item_favorites")
      .select("wardrobe_item_id")
      .eq("user_id", viewer.userId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <StickerStudio
      day={localDate(viewer.weatherTimezone ?? "Asia/Shanghai")}
      error={
        wardrobe.error ??
        (favorites.error ? "收藏暂时无法读取，仍可从全部衣物选择。" : null)
      }
      favoriteIds={(favorites.data ?? []).map(
        (favorite) => favorite.wardrobe_item_id,
      )}
      items={wardrobe.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        cutoutUrl: item.cutoutUrl,
      }))}
      storageKey={`ensemble:sticker-studio:${viewer.shortId}:${localDate(viewer.weatherTimezone ?? "Asia/Shanghai")}`}
    />
  );
}
