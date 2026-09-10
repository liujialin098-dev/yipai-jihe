import { ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
export function TrendInspirationPanel() {
  return (
    <section className="mt-7" aria-labelledby="trend-inspiration-title">
      <div className="overflow-hidden rounded-[1.65rem] bg-[var(--fashion-lilac-soft)] p-5 shadow-[0_16px_42px_rgba(79,61,137,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="trend-inspiration-title" className="app-section-title">
              继续找穿搭灵感
            </h2>
          </div>
          <Newspaper
            className="size-5 text-[var(--system-blue)]"
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </div>
        <Link
          href="/inspiration"
          className="motion-button mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)]"
        >
          打开时尚灵感
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
