import { Archive, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  colorSwatch,
  optionLabel,
} from "@/lib/wardrobe/constants";
import type { WardrobeItem } from "@/lib/wardrobe/data";

export function WardrobeItemCard({
  eager = false,
  index = 0,
  item,
}: {
  eager?: boolean;
  index?: number;
  item: WardrobeItem;
}) {
  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="surface-card pressable stagger-item group min-w-0 rounded-[1.45rem] p-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--system-blue)]"
      style={{ "--stagger": Math.min(index, 8) } as React.CSSProperties}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.05rem] bg-[var(--surface-soft)]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={`${item.name}${item.demo_key ? "的演示棚拍图" : "的原图"}`}
            fill
            sizes="(max-width: 480px) 44vw, 210px"
            loading={eager ? "eager" : "lazy"}
            unoptimized
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[var(--text-tertiary)]">
            <ImageOff className="size-6" aria-hidden="true" />
            <span className="sr-only">原图暂时不可用</span>
          </span>
        )}
      </div>
      <div className="px-1 pt-3 pb-1">
        <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">
          {item.name}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-[0.68rem] text-[var(--text-tertiary)]">
          <span>{optionLabel(CATEGORY_OPTIONS, item.category)}</span>
          <span className="h-3 w-px bg-[var(--hairline)]" aria-hidden="true" />
          <span className="inline-flex min-w-0 items-center gap-1">
            <span
              className="size-2.5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: colorSwatch(item.primary_color) }}
              aria-hidden="true"
            />
            <span className="truncate">
              {optionLabel(COLOR_OPTIONS, item.primary_color)}
            </span>
          </span>
        </div>
        {item.status === "archived" ? (
          <p className="mt-2 flex items-center gap-1 text-[0.68rem] font-medium text-[var(--system-blue)]">
            <Archive className="size-3" aria-hidden="true" />
            已归档
          </p>
        ) : null}
      </div>
    </Link>
  );
}
