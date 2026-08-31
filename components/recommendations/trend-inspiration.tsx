import { ArrowUpRight, Newspaper } from "lucide-react";
import type { RecommendationOccasion } from "@/lib/recommendations/constants";
import { currentTrendInspirations } from "@/lib/recommendations/trend-catalog";
import { STYLE_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function TrendInspirationPanel({
  occasion,
}: {
  occasion: RecommendationOccasion;
}) {
  const trends = currentTrendInspirations(occasion);
  if (trends.length === 0) return null;

  return (
    <section className="mt-7" aria-labelledby="trend-inspiration-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="app-page-meta">有日期与来源</p>
          <h2 id="trend-inspiration-title" className="app-section-title mt-1">
            本季穿搭灵感
          </h2>
        </div>
        <Newspaper
          className="size-4 text-[var(--system-blue)]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--text-tertiary)]">
        把趋势落到现有衣橱，不需要为了跟风购买新衣。
      </p>
      <div className="mt-4 grid gap-3">
        {trends.map((trend) => (
          <article
            key={trend.id}
            className="surface-card rounded-[1.45rem] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="rounded-full bg-[var(--system-blue-soft)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--system-blue)]">
                  {optionLabel(STYLE_OPTIONS, trend.style)}
                </span>
                <h3 className="app-card-title mt-3">{trend.title}</h3>
              </div>
              <a
                href={trend.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`查看${trend.sourceName}来源`}
                className="pressable flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)]"
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {trend.summary}
            </p>
            <p className="mt-3 text-[0.68rem] leading-5 text-[var(--text-tertiary)]">
              {trend.sourceName} · 更新于
              {dateFormatter.format(new Date(`${trend.publishedAt}T12:00:00Z`))}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
