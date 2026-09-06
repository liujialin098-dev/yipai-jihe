import { cn } from "@/lib/utils";

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("brand-name-lockup", className)}>
      <span className="brand-name-english">Ensemble</span>
      <span className="brand-name-chinese">衣拍即合</span>
    </span>
  );
}
