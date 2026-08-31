import Image from "next/image";
import { ImageIcon, Lightbulb } from "lucide-react";
import type { CSSProperties } from "react";
import { RecommendationDiaryButton } from "@/components/diary/recommendation-diary-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { LookbookGenerator } from "@/components/recommendations/lookbook-generator";
import { ReplaceItemPanel } from "@/components/recommendations/replace-item-panel";
import type { RecommendationOutfitView } from "@/lib/recommendations/constants";
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
  const hasLookbook = Boolean(outfit.lookbookImageUrl);

  return (
    <article
      className="surface-card stagger-item overflow-hidden rounded-[1.75rem]"
      style={{ "--stagger": index + 1 } as CSSProperties}
    >
      <div className="bg-[#f4f6f8] p-3">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[1.35rem] bg-[#eef1f4] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <Image
            src={
              outfit.lookbookImageUrl ?? "/virtual-models/neutral-studio.png"
            }
            alt={
              hasLookbook
                ? `${outfit.title}的虚拟模特搭配效果参考`
                : "无身份虚拟模特效果图占位"
            }
            fill
            sizes="(max-width: 480px) calc(100vw - 64px), 390px"
            unoptimized={hasLookbook}
            className={`object-cover object-top ${
              hasLookbook ? "" : "opacity-88 saturate-50"
            }`}
            priority={index === 0}
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/88 px-3 py-1.5 text-[0.68rem] font-semibold text-[#1d1d1f] shadow-[0_6px_20px_rgba(29,29,31,0.08)] backdrop-blur-md">
            <ImageIcon
              className="size-3.5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {hasLookbook ? "虚拟模特效果" : "虚拟模特预览"}
          </span>
          {!hasLookbook ? (
            <div className="absolute inset-x-3 bottom-3 rounded-[1.15rem] border border-white/70 bg-white/82 px-4 py-3 backdrop-blur-xl">
              <p className="text-sm font-semibold text-[#1d1d1f]">
                先看整体比例
              </p>
              <p className="mt-1 text-xs leading-5 text-[#666a73]">
                点击后按这套衣物生成，通常需要几十秒。
              </p>
            </div>
          ) : null}
        </div>
        <div className="px-1 pt-3">
          <LookbookGenerator
            hasImage={hasLookbook}
            recommendationId={recommendationId}
            slot={outfit.slot}
          />
          <p className="mt-2 text-center text-[0.68rem] leading-5 text-[var(--text-tertiary)]">
            仅供搭配比例参考，实际颜色与版型以衣物实拍为准
          </p>
        </div>
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
