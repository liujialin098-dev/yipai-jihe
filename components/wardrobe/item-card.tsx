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

export function WardrobeItemCard({ item }: { item: WardrobeItem }) {
  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="group min-w-0 rounded-[1.4rem] border border-black/6 bg-white p-2.5 shadow-[0_10px_30px_rgba(42,38,54,0.05)] transition-transform active:translate-y-px"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem] bg-[#ebecef]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={`${item.name}的合成演示原图`}
            fill
            sizes="(max-width: 480px) 44vw, 210px"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[#8a858f]">
            <ImageOff className="size-6" aria-hidden="true" />
            <span className="sr-only">原图暂时不可用</span>
          </span>
        )}
      </div>
      <div className="px-1 pt-3 pb-1">
        <h2 className="truncate text-sm font-semibold text-[#292631]">
          {item.name}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-[0.68rem] text-[#77717c]">
          <span>{optionLabel(CATEGORY_OPTIONS, item.category)}</span>
          <span className="h-3 w-px bg-black/10" aria-hidden="true" />
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
          <p className="mt-2 flex items-center gap-1 text-[0.68rem] font-medium text-[#776c87]">
            <Archive className="size-3" aria-hidden="true" />
            已归档
          </p>
        ) : null}
      </div>
    </Link>
  );
}
