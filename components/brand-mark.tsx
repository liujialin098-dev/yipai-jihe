import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  sizes = "44px",
}: {
  className?: string;
  sizes?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "brand-mark relative block shrink-0 overflow-hidden rounded-[0.95rem] bg-[#f5f5f7] ring-1 ring-black/5",
        className,
      )}
    >
      <Image
        src="/brand/ensemble-icon-a-folded-e.png"
        alt=""
        fill
        sizes={sizes}
        className="object-contain"
      />
    </span>
  );
}
