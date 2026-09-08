"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useStickerOutlineColor } from "@/components/stickers/outline-controls";
import { loadOutlineMask, outlinePalette } from "@/lib/stickers/outline";
import { cn } from "@/lib/utils";

type GarmentStickerProps = {
  alt: string;
  imageUrl: string | null;
  cutoutUrl?: string | null;
  sizes: string;
  eager?: boolean;
  className?: string;
  imageClassName?: string;
  surface?: "card" | "loose";
};

export function GarmentSticker({
  alt,
  imageUrl,
  cutoutUrl = null,
  sizes,
  eager = false,
  className,
  imageClassName,
  surface = "card",
}: GarmentStickerProps) {
  const color = useStickerOutlineColor();
  const [mask, setMask] = useState<{ source: string; url: string } | null>(
    null,
  );
  useEffect(() => {
    if (!cutoutUrl) return;
    let active = true;
    void loadOutlineMask(cutoutUrl)
      .then((url) => {
        if (active) setMask({ source: cutoutUrl, url });
      })
      .catch(() => {
        /* 保留实拍，不使用模糊副本冒充描边。 */
      });
    return () => {
      active = false;
    };
  }, [cutoutUrl]);
  const source = cutoutUrl ?? imageUrl;
  if (!source) return null;

  const mode = cutoutUrl ? "cutout" : "photo";
  const fitClassName = mode === "cutout" ? "object-contain" : "object-cover";

  return (
    <span
      className={cn("garment-sticker", className)}
      data-sticker-mode={mode}
      data-sticker-surface={surface}
    >
      {mode === "cutout" ? (
        <span
          aria-hidden="true"
          className="garment-sticker-outline"
          data-outline-ready={mask?.source === source}
          style={{
            backgroundColor: outlinePalette(color).color,
            maskImage: mask?.source === source ? `url("${mask.url}")` : "none",
            visibility: mask?.source === source ? "visible" : "hidden",
          }}
        />
      ) : null}
      <Image
        src={source}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        unoptimized
        className={cn(
          "garment-sticker-image pointer-events-none",
          fitClassName,
          imageClassName,
        )}
      />
    </span>
  );
}
