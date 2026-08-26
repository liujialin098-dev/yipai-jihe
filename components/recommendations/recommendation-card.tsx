import Image from "next/image";
import type { CSSProperties } from "react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ReplaceItemPanel } from "@/components/recommendations/replace-item-panel";
import type { RecommendationOutfit } from "@/lib/recommendations/constants";
import { STYLE_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";
import type { WardrobeItem } from "@/lib/wardrobe/data";

const CARD_BACKGROUNDS = [
  "linear-gradient(145deg, rgba(224,235,250,0.92), rgba(248,250,253,0.98))",
  "linear-gradient(145deg, rgba(231,239,234,0.94), rgba(248,250,249,0.98))",
  "linear-gradient(145deg, rgba(239,233,246,0.92), rgba(250,249,252,0.98))",
] as const;

export function RecommendationCard({
  index,
  outfit,
  items,
  recommendationId,
  sourceKey,
  itemFavoriteIds,
  isOutfitFavorite,
  candidateItemsByCurrentId,
}: {
  index: number;
  outfit: RecommendationOutfit;
  items: WardrobeItem[];
  recommendationId: string;
  sourceKey: string;
  itemFavoriteIds: string[];
  isOutfitFavorite: boolean;
  candidateItemsByCurrentId: Record<string, string[]>;
}) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const outfitItems = outfit.itemIds.flatMap((id) => {
    const item = itemMap.get(id);
    return item ? [item] : [];
  });

  return (
    <article
      className="surface-card stagger-item overflow-hidden rounded-[1.75rem]"
      style={{ "--stagger": index + 1 } as CSSProperties}
    >
      <div
        className="grid min-h-72 grid-cols-2 gap-2 p-3"
        style={{
          background: CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length],
        }}
      >
        {outfitItems.map((item, itemIndex) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-[1.2rem] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ${
              outfitItems.length % 2 === 1 && itemIndex === 0
                ? "row-span-2 min-h-64"
                : "min-h-32"
            }`}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={`${outfit.title}中的${item.name}`}
                fill
                sizes="(max-width: 480px) 45vw, 210px"
                unoptimized
                className="object-cover transition-transform duration-700 ease-out hover:scale-[1.025]"
                priority={index === 0 && itemIndex === 0}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--text-tertiary)]">
                {item.name}
              </div>
            )}
            <div className="absolute top-2 right-2">
              <FavoriteButton
                kind="item"
                itemId={item.id}
                isFavorite={itemFavoriteIds.includes(item.id)}
                compact
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 pt-4.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-page-meta">搭配 {outfit.slot}</p>
            <h2 className="app-card-title mt-1">{outfit.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">
              {outfitItems.length} 件
            </span>
            <FavoriteButton
              kind="outfit"
              recommendationId={recommendationId}
              slot={outfit.slot}
              sourceKey={sourceKey}
              isFavorite={isOutfitFavorite}
              compact
            />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {outfit.reason}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--hairline)] pt-4">
          {outfit.styleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-[0.68rem] font-medium text-[var(--text-secondary)]"
            >
              {optionLabel(STYLE_OPTIONS, tag)}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-[var(--hairline)] pt-4">
          {outfitItems.map((item) => (
            <ReplaceItemPanel
              key={item.id}
              recommendationId={recommendationId}
              slot={outfit.slot}
              currentItem={item}
              candidates={(candidateItemsByCurrentId[item.id] ?? []).flatMap(
                (id) => {
                  const candidate = itemMap.get(id);
                  return candidate ? [candidate] : [];
                },
              )}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
