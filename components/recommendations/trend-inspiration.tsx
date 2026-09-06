import { ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
import {
  recommendationOccasionLabel,
  type RecommendationOccasion,
} from "@/lib/recommendations/constants";

export function TrendInspirationPanel({
  occasion,
}: {
  occasion: RecommendationOccasion;
}) {
  return (
    <section className="mt-7" aria-labelledby="trend-inspiration-title">
      <div className="overflow-hidden rounded-[1.65rem] bg-[var(--fashion-lilac-soft)] p-5 shadow-[0_16px_42px_rgba(79,61,137,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#6556a8]">
              同一套可信来源规则
            </p>
            <h2 id="trend-inspiration-title" className="app-section-title mt-2">
              继续找穿搭灵感
            </h2>
          </div>
          <Newspaper
            className="size-5 text-[#6556a8]"
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          看最近的趋势、单品与配色，再把{recommendationOccasionLabel(occasion)}
          搭配落回现有衣橱。
        </p>
        <Link
          href="/inspiration"
          className="motion-button mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
        >
          打开时尚灵感
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
