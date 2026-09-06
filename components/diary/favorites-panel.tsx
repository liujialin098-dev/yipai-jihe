import { type Heart, Shirt, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { getViewer } from "@/lib/auth/viewer";
import { isWardrobeStyle } from "@/lib/feedback/preferences";
import { createClient } from "@/lib/supabase/server";
import { STYLE_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";
import { getWardrobeItems, type WardrobeItem } from "@/lib/wardrobe/data";

type OutfitSnapshot = {
  title: string;
  reason: string;
  slot: number;
  styleTags: string[];
  itemIds: string[];
};

function parseOutfit(value: unknown): OutfitSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Record<string, unknown>;
  if (
    typeof snapshot.title !== "string" ||
    typeof snapshot.reason !== "string" ||
    typeof snapshot.slot !== "number" ||
    !Array.isArray(snapshot.styleTags) ||
    !Array.isArray(snapshot.itemIds)
  ) {
    return null;
  }
  return {
    title: snapshot.title,
    reason: snapshot.reason,
    slot: snapshot.slot,
    styleTags: snapshot.styleTags.filter(
      (style): style is string =>
        typeof style === "string" && isWardrobeStyle(style),
    ),
    itemIds: snapshot.itemIds.filter(
      (id): id is string => typeof id === "string",
    ),
  };
}

export async function FavoritesPanel() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const [active, archived, itemFavoriteResult, outfitFavoriteResult] =
    await Promise.all([
      getWardrobeItems({ q: "", status: "active" }),
      getWardrobeItems({ q: "", status: "archived" }),
      supabase
        .from("wardrobe_item_favorites")
        .select("wardrobe_item_id")
        .eq("user_id", viewer.userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("outfit_favorites")
        .select("id, source_key, outfit")
        .eq("user_id", viewer.userId)
        .order("created_at", { ascending: false }),
    ]);
  const allItems = [...active.items, ...archived.items];
  const itemMap = new Map(allItems.map((item) => [item.id, item]));
  const favoriteItems = (itemFavoriteResult.data ?? []).flatMap((favorite) => {
    const item = itemMap.get(favorite.wardrobe_item_id);
    return item ? [item] : [];
  });
  const favoriteOutfits = (outfitFavoriteResult.data ?? []).flatMap((row) => {
    const outfit = parseOutfit(row.outfit);
    return outfit ? [{ ...row, outfit }] : [];
  });

  return (
    <div>
      <p className="mt-5 text-center text-xs text-[var(--text-tertiary)]">
        已保存 {favoriteItems.length + favoriteOutfits.length} 项
      </p>

      <FavoriteSection
        title="整套穿搭"
        icon={Sparkles}
        empty="在今日推荐里收藏整套后，会出现在这里。"
        count={favoriteOutfits.length}
      >
        {favoriteOutfits.map((favorite) => {
          const outfitItems = favorite.outfit.itemIds.map((id) => ({
            id,
            item: itemMap.get(id) ?? null,
          }));
          return (
            <article
              key={favorite.id}
              className="surface-card overflow-hidden rounded-[1.65rem]"
            >
              <div className="grid grid-cols-3 gap-1.5 bg-[var(--surface-soft)] p-2.5">
                {outfitItems.slice(0, 3).map(({ id, item }) => (
                  <FavoriteImage key={id} item={item} />
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="app-card-title">{favorite.outfit.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                      {favorite.outfit.reason}
                    </p>
                  </div>
                  <FavoriteButton
                    kind="outfit"
                    recommendationId={favorite.source_key.split(":")[0] ?? ""}
                    slot={favorite.outfit.slot}
                    sourceKey={favorite.source_key}
                    isFavorite
                    compact
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {favorite.outfit.styleTags.map((style) => (
                    <span
                      key={style}
                      className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[0.65rem]"
                    >
                      {optionLabel(STYLE_OPTIONS, style)}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </FavoriteSection>

      <FavoriteSection
        title="单品收藏"
        icon={Shirt}
        empty="在衣物详情或推荐卡上点爱心，就能保存单品。"
        count={favoriteItems.length}
      >
        <div className="grid grid-cols-2 gap-3">
          {favoriteItems.map((item) => (
            <article
              key={item.id}
              className="surface-card overflow-hidden rounded-[1.35rem]"
            >
              <Link
                href={`/wardrobe/${item.id}`}
                className="relative block aspect-[4/5] bg-[var(--surface-soft)]"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="180px"
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </Link>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-xs font-semibold">
                  {item.name}
                </span>
                <FavoriteButton
                  kind="item"
                  itemId={item.id}
                  isFavorite
                  compact
                />
              </div>
            </article>
          ))}
        </div>
      </FavoriteSection>
    </div>
  );
}

function FavoriteSection({
  title,
  count,
  empty,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  icon: typeof Heart;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="app-section-title flex items-center gap-2">
          <Icon className="size-4 text-[#79618f]" aria-hidden="true" />
          {title}
        </h2>
        <span className="text-xs text-[var(--text-tertiary)]">{count}</span>
      </div>
      {count > 0 ? (
        <div className="grid gap-4">{children}</div>
      ) : (
        <p className="rounded-[1.35rem] border border-dashed border-[var(--hairline-strong)] px-4 py-6 text-center text-sm leading-6 text-[var(--text-secondary)]">
          {empty}
        </p>
      )}
    </section>
  );
}

function FavoriteImage({ item }: { item: WardrobeItem | null }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[0.95rem] bg-white">
      {item?.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          loading="eager"
          sizes="120px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center px-2 text-center text-[0.65rem] text-[var(--text-tertiary)]">
          单品已移除
        </span>
      )}
    </div>
  );
}
