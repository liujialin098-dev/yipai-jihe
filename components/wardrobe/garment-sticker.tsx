import Image from "next/image";
import { cn } from "@/lib/utils";

type GarmentStickerProps = {
  alt: string;
  imageUrl: string | null;
  cutoutUrl?: string | null;
  sizes: string;
  eager?: boolean;
  className?: string;
  imageClassName?: string;
};

export function GarmentSticker({
  alt,
  imageUrl,
  cutoutUrl = null,
  sizes,
  eager = false,
  className,
  imageClassName,
}: GarmentStickerProps) {
  const source = cutoutUrl ?? imageUrl;
  if (!source) return null;

  const mode = cutoutUrl ? "cutout" : "photo";
  const fitClassName = mode === "cutout" ? "object-contain" : "object-cover";

  return (
    <span className={cn("garment-sticker", className)} data-sticker-mode={mode}>
      {mode === "cutout" ? (
        <Image
          src={source}
          alt=""
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          unoptimized
          aria-hidden="true"
          className="garment-sticker-outline object-contain"
        />
      ) : null}
      <Image
        src={source}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        unoptimized
        className={cn("garment-sticker-image", fitClassName, imageClassName)}
      />
    </span>
  );
}
