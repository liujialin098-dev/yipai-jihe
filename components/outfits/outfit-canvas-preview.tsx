import type { CSSProperties } from "react";
import {
  outfitCanvasTheme,
  type OutfitCanvasItem,
  type OutfitCanvasTheme,
} from "@/lib/outfits/canvas";
import type { OutfitCanvasWardrobeItem } from "@/lib/outfits/data";

export function OutfitCanvasPreview({
  title,
  theme,
  items,
  wardrobeItems,
  className = "",
  compact = false,
}: {
  title: string;
  theme: OutfitCanvasTheme;
  items: OutfitCanvasItem[];
  wardrobeItems: OutfitCanvasWardrobeItem[];
  className?: string;
  compact?: boolean;
}) {
  const palette = outfitCanvasTheme(theme);
  const wardrobeMap = new Map(wardrobeItems.map((item) => [item.id, item]));

  return (
    <section
      aria-label={`${title}衣物排布预览`}
      className={`outfit-canvas relative aspect-[4/5] overflow-hidden rounded-[1.5rem] ${className}`}
      style={
        {
          "--canvas-bg": palette.color,
          "--canvas-ink": palette.text,
        } as CSSProperties
      }
    >
      <div
        className={`absolute z-20 max-w-[70%] ${compact ? "top-3 left-3" : "top-5 left-5"}`}
      >
        <p
          className={`font-heading leading-tight font-semibold tracking-[-0.025em] text-[var(--canvas-ink)] ${compact ? "text-[0.72rem]" : "text-[1.2rem]"}`}
        >
          {title}
        </p>
        <p
          className={`${compact ? "mt-0.5 text-[0.45rem]" : "mt-1 text-[0.62rem]"} font-semibold text-[color-mix(in_srgb,var(--canvas-ink)_62%,transparent)]`}
        >
          衣拍即合
        </p>
      </div>

      {[...items]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layoutItem) => {
          const wardrobeItem = wardrobeMap.get(layoutItem.wardrobeItemId);
          if (!wardrobeItem) return null;
          const imageUrl = wardrobeItem.cutoutUrl ?? wardrobeItem.imageUrl;
          return (
            <div
              key={layoutItem.wardrobeItemId}
              className="absolute flex aspect-square items-center justify-center"
              style={{
                left: `${layoutItem.x * 100}%`,
                top: `${layoutItem.y * 100}%`,
                width: `${28 * layoutItem.scale}%`,
                zIndex: layoutItem.zIndex,
                transform: `translate(-50%, -50%) rotate(${layoutItem.rotation}deg)`,
              }}
            >
              {imageUrl ? (
                // Signed private images and public demo assets are already scoped.
                // biome-ignore lint/performance/noImgElement: Browser-authenticated private images must bypass the Next Image optimization proxy.
                <img
                  src={imageUrl}
                  alt={wardrobeItem.name}
                  className={`max-h-full max-w-full object-contain ${wardrobeItem.cutoutUrl ? "drop-shadow-[0_12px_16px_rgba(32,33,36,0.12)]" : "rounded-[0.9rem]"}`}
                />
              ) : (
                <span className="rounded-[0.8rem] bg-white/78 px-2 py-2 text-center text-[0.58rem] font-medium text-[#47494e]">
                  {wardrobeItem.name}
                </span>
              )}
            </div>
          );
        })}
    </section>
  );
}
