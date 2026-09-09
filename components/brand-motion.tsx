import Image from "next/image";
import { BrandName } from "@/components/brand-name";
import { cn } from "@/lib/utils";

const BRAND_ICON = "/brand/ensemble-icon-a-folded-e.png";

function BrandIconLayer({ className }: { className: string }) {
  return (
    <span className={className}>
      <Image
        src={BRAND_ICON}
        alt=""
        fill
        sizes="(max-width: 480px) 144px, 160px"
        loading="eager"
        className="object-contain"
      />
    </span>
  );
}

export function BrandMotion({
  variant = "loader",
  label = "正在准备页面",
  className,
}: {
  variant?: "loader" | "splash";
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("brand-motion", className)}
      data-variant={variant}
      role={variant === "loader" ? "status" : undefined}
      aria-live={variant === "loader" ? "polite" : undefined}
    >
      <span className="brand-motion-stage" aria-hidden="true">
        <span className="brand-motion-halo" />
        <span className="brand-motion-mark">
          <BrandIconLayer className="brand-motion-mark-base" />
          <BrandIconLayer className="brand-motion-part brand-motion-part--top" />
          <BrandIconLayer className="brand-motion-part brand-motion-part--middle" />
          <BrandIconLayer className="brand-motion-part brand-motion-part--bottom" />
          <span className="brand-motion-sheen" />
        </span>
      </span>

      {variant === "splash" ? (
        <BrandName className="brand-motion-name" />
      ) : (
        <span className="brand-motion-label">{label}</span>
      )}
    </div>
  );
}

export function LaunchSplash() {
  return (
    <div className="brand-splash" aria-hidden="true">
      <BrandMotion variant="splash" />
    </div>
  );
}
