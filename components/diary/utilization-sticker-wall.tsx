import type { CSSProperties } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import type { DiaryItemUtilization } from "@/lib/diary/report";

const ROTATIONS = [-7, 4, -3, 8, -5, 2, 6, -8, 3, -2] as const;

export function UtilizationStickerWall({
  items,
}: {
  items: DiaryItemUtilization[];
}) {
  return (
    <section className="mt-6" aria-labelledby="recent-sticker-wall-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="app-page-meta">最近 30 天</p>
          <h2 id="recent-sticker-wall-title" className="app-section-title mt-1">
            穿过的单品
          </h2>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {items.length} 件
        </span>
      </div>

      {items.length > 0 ? (
        <div className="utilization-sticker-wall relative mt-4 aspect-[4/3] overflow-hidden rounded-[1.8rem]">
          {items.map(({ item, wearCount }, index) => {
            const column = index % 5;
            const row = Math.floor(index / 5);
            const rowCount = Math.ceil(items.length / 5);
            const left = 10 + column * 20 + (row % 2 === 0 ? 0 : -3);
            const top = 12 + row * (76 / Math.max(1, rowCount - 1));
            return (
              <div
                key={item.id}
                className="utilization-sticker-piece absolute aspect-square w-[24%]"
                style={
                  {
                    left: `${left}%`,
                    top: `${Math.min(82, top)}%`,
                    transform: `translate(-50%, -50%) rotate(${ROTATIONS[index % ROTATIONS.length]}deg)`,
                    zIndex: index + 1,
                  } as CSSProperties
                }
              >
                <GarmentSticker
                  imageUrl={item.imageUrl}
                  cutoutUrl={item.cutoutUrl}
                  alt={`${item.name}，近 30 天穿着 ${wearCount} 次`}
                  sizes="110px"
                  surface={item.cutoutUrl ? "loose" : "card"}
                  className="size-full rounded-[0.8rem]"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.8rem] border border-dashed border-[var(--hairline-strong)] px-5 py-9 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            最近 30 天还没有穿搭记录。
          </p>
          <Link
            href="/diary/new"
            className="motion-button mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)]"
          >
            <Plus className="size-4" aria-hidden="true" />
            添加一件单品
          </Link>
        </div>
      )}
    </section>
  );
}
