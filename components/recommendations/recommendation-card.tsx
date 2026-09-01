import Image from "next/image";
import { Lightbulb, MoveUpRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { RecommendationDiaryButton } from "@/components/diary/recommendation-diary-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { OutfitCanvasPreview } from "@/components/outfits/outfit-canvas-preview";
import { ReplaceItemPanel } from "@/components/recommendations/replace-item-panel";
import type { RecommendationOutfitView } from "@/lib/recommendations/constants";
import {
  createInitialCanvasItems,
  type OutfitCanvasTheme,
} from "@/lib/outfits/canvas";
import {
  deriveOutfitLayers,
  OUTFIT_LAYER_LABELS,
} from "@/lib/recommendations/layers";
import { toRecommendationItem } from "@/lib/recommendations/data";
import { STYLE_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";
import type { WardrobeItem } from "@/lib/wardrobe/data";

export function RecommendationCard({
  index,
  outfit,
  items,
  recommendationId,
  sourceKey,
  itemFavoriteIds,
  isOutfitFavorite,
  candidateItemsByCurrentId,
  canRecordToday,
}: {
  index: number;
  outfit: RecommendationOutfitView;
  items: WardrobeItem[];
  recommendationId: string;
  sourceKey: string;
  itemFavoriteIds: string[];
  isOutfitFavorite: boolean;
  candidateItemsByCurrentId: Record<string, string[]>;
  canRecordToday: boolean;
}) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const outfitItems = outfit.itemIds.flatMap((id) => {
    const item = itemMap.get(id);
    return item ? [item] : [];
  });
  const roleByItemId = new Map(
    deriveOutfitLayers(outfit.itemIds, items.map(toRecommendationItem)).map(
      (layer) => [layer.itemId, OUTFIT_LAYER_LABELS[layer.role]],
    ),
  );
  const canvasTheme = (["lime", "lilac", "sky"] as OutfitCanvasTheme[])[
    index % 3
  ];
  const canvasItems = createInitialCanvasItems(
    outfit.itemIds,
    new Map(outfitItems.map((item) => [item.id, item.category])),
  );

  return (
    <article
      className="surface-card stagger-item overflow-hidden rounded-[1.75rem]"
      style={{ "--stagger": index + 1 } as CSSProperties}
    >
      <div className="bg-[linear-gradient(145deg,var(--fashion-lilac-soft),var(--fashion-sky-soft)_55%,var(--fashion-lime-soft))] p-3">
        <OutfitCanvasPreview
          title={outfit.title}
          theme={canvasTheme}
          items={canvasItems}
          wardrobeItems={outfitItems}
        />
        <Link
          href={`/outfits/new?recommendationId=${recommendationId}&slot=${outfit.slot}`}
          className="motion-button mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-[#202124] px-4 text-sm font-semibold text-white"
        >
          编辑穿搭卡片
          <MoveUpRight className="size-4" aria-hidden="true" />
        </Link>
        <p className="mt-2 text-center text-[0.68rem] leading-5 text-[var(--text-tertiary)]">
          只使用真实衣物。进入画布后可以拖动、抠图和分享。
        </p>
      </div>

      <div className="border-t border-[var(--hairline)] bg-white p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            衣物实拍核对
          </p>
          <span className="text-[0.68rem] text-[var(--text-tertiary)]">
            {outfitItems.length} 件
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {outfitItems.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-[1.05rem] bg-[var(--surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={`${outfit.title}中的${item.name}`}
                  fill
                  sizes="(max-width: 480px) 28vw, 120px"
                  unoptimized
                  className="object-cover transition-transform duration-700 ease-out hover:scale-[1.025]"
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
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-1 text-[0.6rem] font-semibold text-[#3a3d43] shadow-sm backdrop-blur-md">
                {roleByItemId.get(item.id) ?? "单品"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 pt-4.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-page-meta">搭配 {outfit.slot}</p>
            <h2 className="app-card-title mt-1">{outfit.title}</h2>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="mt-3 flex items-start gap-2 rounded-[1rem] bg-[var(--surface-soft)] px-3.5 py-3 text-xs leading-5 text-[var(--text-secondary)]">
          <Lightbulb
            className="mt-0.5 size-3.5 shrink-0 text-[var(--system-blue)]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span>{outfit.stylingPoint}</span>
        </div>
        <div className="mt-4 border-t border-[var(--hairline)] pt-4">
          {canRecordToday ? (
            <RecommendationDiaryButton
              recommendationId={recommendationId}
              slot={outfit.slot}
            />
          ) : (
            <p className="rounded-[1rem] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
              明日方案先作为参考，实际穿过后再记入日记和利用率。
            </p>
          )}
        </div>
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
