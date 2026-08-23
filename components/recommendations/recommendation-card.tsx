import Image from "next/image";
import type { CSSProperties } from "react";
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
}: {
  index: number;
  outfit: RecommendationOutfit;
  items: WardrobeItem[];
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
          </div>
        ))}
      </div>

      <div className="p-5 pt-4.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--system-blue)]">
              第 {outfit.slot} 套
            </p>
            <h2 className="mt-1 font-heading text-[1.55rem] font-bold tracking-[-0.045em] text-[var(--foreground)]">
              {outfit.title}
            </h2>
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            {outfitItems.length} 件
          </span>
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
      </div>
    </article>
  );
}
