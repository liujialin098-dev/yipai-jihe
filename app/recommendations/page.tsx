import type { Metadata } from "next";
import { Shirt } from "lucide-react";
import Link from "next/link";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RecommendationControls } from "@/components/recommendations/recommendation-controls";
import { RecommendationViewTracker } from "@/components/recommendations/recommendation-view-tracker";
import { TrendInspirationPanel } from "@/components/recommendations/trend-inspiration";
import { WeatherCitySelector } from "@/components/recommendations/weather-city-selector";
import { WeatherPanel } from "@/components/recommendations/weather-panel";
import {
  isRecommendationTargetDay,
  recommendationOccasionLabel,
  type RecommendationTargetDay,
} from "@/lib/recommendations/constants";
import {
  getRecommendationPageData,
  toRecommendationItem,
} from "@/lib/recommendations/data";
import { replacementCandidates } from "@/lib/feedback/replacement";

export const metadata: Metadata = { title: "穿搭推荐" };

function dateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function dayHref(targetDay: RecommendationTargetDay) {
  return `/recommendations?day=${targetDay}`;
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string | string[] }>;
}) {
  const dayValue = (await searchParams).day;
  const targetDay = isRecommendationTargetDay(dayValue) ? dayValue : "today";
  const targetLabel = targetDay === "tomorrow" ? "明日" : "今日";
  const {
    error,
    items,
    recommendation,
    itemFavoriteIds,
    outfitFavoriteKeys,
    ipCitySuggestion,
    usingWeatherCityOverride,
    weatherCity,
    weatherSavedCity,
    targetDate,
    viewerId,
  } = await getRecommendationPageData(targetDay);

  return (
    <div className="page-enter px-5 pt-4">
      <header className="text-center">
        <p className="app-page-meta">
          {dateLabel(targetDate)}，{targetLabel}穿搭
        </p>
        <h1 className="app-page-title mt-2">
          {targetDay === "tomorrow" ? "明天穿什么" : "今天穿什么"}
        </h1>
      </header>

      <nav
        aria-label="选择搭配日期"
        className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-[var(--surface-soft)] p-1"
      >
        {(["today", "tomorrow"] as const).map((day) => {
          const selected = day === targetDay;
          return (
            <Link
              key={day}
              href={dayHref(day)}
              aria-current={selected ? "page" : undefined}
              className={`motion-button flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                selected
                  ? "bg-[var(--control-primary)] text-[var(--control-primary-foreground)] shadow-[0_8px_22px_rgba(29,29,31,0.16)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {day === "today" ? "今天" : "明天"}
            </Link>
          );
        })}
      </nav>

      <WeatherPanel
        key={`${viewerId}-${weatherCity}-${targetDate}-${usingWeatherCityOverride}`}
        city={weatherCity}
        targetDay={targetDay}
        targetDate={targetDate}
      >
        <WeatherCitySelector
          currentCity={weatherCity}
          savedCity={weatherSavedCity}
          ipSuggestion={ipCitySuggestion}
          usingSessionOverride={usingWeatherCityOverride}
        />

        <section className="mt-5">
          <RecommendationControls
            key={`${targetDay}-${recommendation?.id ?? "new"}-${recommendation?.occasion ?? "commute"}`}
            defaultOccasion={recommendation?.occasion ?? "commute"}
            hasRecommendation={Boolean(recommendation)}
            targetDay={targetDay}
          />
        </section>
      </WeatherPanel>

      {error ? (
        <p className="motion-status mt-4 rounded-[1.1rem] bg-[var(--danger-surface)] px-4 py-3 text-sm leading-6 text-[var(--danger-text)]">
          {error}
        </p>
      ) : null}

      {recommendation ? (
        <section
          className="mt-7 space-y-5"
          aria-label={`${targetLabel}三套推荐`}
        >
          <RecommendationViewTracker
            recommendationId={recommendation.id}
            version={recommendation.updatedAt}
          />
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="app-section-title">搭配结果</h2>
              <details className="mt-2 text-xs text-[var(--text-secondary)]">
                <summary className="cursor-pointer py-2">生成信息</summary>
                <p className="mt-2 text-xs leading-5 text-[var(--text-tertiary)]">
                  {recommendationOccasionLabel(recommendation.occasion)} ·{" "}
                  {recommendation.source === "ai" ? "AI 生成" : "基础生成"}。
                  生成时天气：{recommendation.weather.city}，
                  {recommendation.weather.summary}，
                  {recommendation.weather.temperatureBasis === "air_minimum"
                    ? "最低气温"
                    : "体感"}{" "}
                  {recommendation.weather.apparentTemperatureC}°C （
                  {recommendation.weather.provider === "qweather"
                    ? "和风天气"
                    : "Open-Meteo 历史快照"}
                  ，
                  {new Date(recommendation.weather.observedAt).toLocaleString(
                    "zh-CN",
                    { timeZone: "Asia/Shanghai" },
                  )}
                  ）。
                </p>
              </details>
            </div>
            <span className="pb-1 text-xs text-[var(--text-tertiary)]">
              3 套
            </span>
          </div>
          {recommendation.outfits.map((outfit, index) => (
            <RecommendationCard
              key={`${recommendation.id}-${outfit.slot}`}
              index={index}
              outfit={outfit}
              items={items}
              recommendationId={recommendation.id}
              sourceKey={`${recommendation.id}:${recommendation.updatedAt}:${outfit.slot}`}
              itemFavoriteIds={itemFavoriteIds}
              isOutfitFavorite={outfitFavoriteKeys.includes(
                `${recommendation.id}:${recommendation.updatedAt}:${outfit.slot}`,
              )}
              candidateItemsByCurrentId={Object.fromEntries(
                outfit.itemIds.map((currentItemId) => [
                  currentItemId,
                  replacementCandidates({
                    items: items.map(toRecommendationItem),
                    outfits: recommendation.outfits,
                    currentItemId,
                    occasion: recommendation.occasion,
                    weather: recommendation.weather,
                  }).map((candidate) => candidate.id),
                ]),
              )}
              canRecordToday={targetDay === "today"}
            />
          ))}
        </section>
      ) : (
        <section className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--hairline-strong)] px-5 py-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
            <Shirt className="size-5" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <h2 className="app-section-title mt-4">
            {items.length > 0 ? "衣橱已就绪，可以开始" : "先准备你的衣橱"}
          </h2>
          <p className="mx-auto mt-2 max-w-[17rem] text-sm leading-6 text-[var(--text-secondary)]">
            {items.length > 0
              ? `${items.length} 件衣物待搭配`
              : "添加衣物，开始搭配。"}
          </p>
          {items.length === 0 ? (
            <Link
              href="/wardrobe"
              className="motion-button mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)]"
            >
              前往衣橱
            </Link>
          ) : null}
        </section>
      )}
      <TrendInspirationPanel />
    </div>
  );
}
