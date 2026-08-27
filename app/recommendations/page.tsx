import type { Metadata } from "next";
import { CloudRain, CloudSun, Info, Shirt } from "lucide-react";
import Link from "next/link";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RecommendationControls } from "@/components/recommendations/recommendation-controls";
import { RecommendationViewTracker } from "@/components/recommendations/recommendation-view-tracker";
import { WeatherCitySelector } from "@/components/recommendations/weather-city-selector";
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
  } = await getRecommendationPageData(targetDay);
  const WeatherIcon =
    recommendation && recommendation.weather.weatherCode >= 51
      ? CloudRain
      : CloudSun;

  return (
    <div className="page-enter px-5 pt-4">
      <header>
        <p className="app-page-meta">
          {dateLabel(targetDate)}，{targetLabel}穿搭
        </p>
        <h1 className="app-page-title mt-2">
          {targetDay === "tomorrow" ? "明天穿什么" : "今天穿什么"}
        </h1>
        <p className="app-page-lead mt-3">
          从现有衣物中，按
          {targetDay === "tomorrow" ? "明日预报" : "当前天气"}
          和场合生成 3 套搭配。
        </p>
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
                  ? "bg-[#1d1d1f] text-white shadow-[0_8px_22px_rgba(29,29,31,0.16)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {day === "today" ? "今天" : "明天"}
            </Link>
          );
        })}
      </nav>

      {recommendation ? (
        <section className="bubble-enter mt-6 overflow-hidden rounded-[1.65rem] bg-[#1d1d1f] p-4.5 text-white shadow-[0_18px_50px_rgba(29,29,31,0.2)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-white/12">
                <WeatherIcon
                  className="size-5"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="text-xs text-white/62">
                  {recommendation.weather.city}，
                  {targetDay === "tomorrow"
                    ? "Open-Meteo 明日预报"
                    : "Open-Meteo 实时天气"}
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {recommendation.weather.summary}，
                  {targetDay === "tomorrow" ? "最低体感" : "体感"}{" "}
                  {recommendation.weather.apparentTemperatureC}°C
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/12 pt-3 text-xs text-white/62">
            <span>{recommendationOccasionLabel(recommendation.occasion)}</span>
            <span>
              {recommendation.source === "ai" ? "AI 生成" : "基础生成"}，
              {(recommendation.generationMs / 1000).toFixed(1)} 秒
            </span>
          </div>
        </section>
      ) : null}

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

      {error ? (
        <p className="motion-status mt-4 rounded-[1.1rem] bg-[#ff453a]/8 px-4 py-3 text-sm leading-6 text-[#b42318]">
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
              <p className="app-page-meta mt-1">全部来自当前衣橱</p>
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
            />
          ))}
          <div className="flex items-start gap-3 rounded-[1.35rem] bg-[var(--surface-soft)] px-4 py-3.5 text-xs leading-5 text-[var(--text-secondary)]">
            <Info
              className="mt-0.5 size-4 shrink-0 text-[var(--system-blue)]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            推荐会参考衣物标签。出门前请按实际体感和活动强度调整增减。
          </div>
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
              ? `当前有 ${items.length} 件活跃衣物，生成后这里会出现三套真实搭配。`
              : "加载演示衣橱或添加自己的衣物，推荐才会引用真实单品。"}
          </p>
          {items.length === 0 ? (
            <Link
              href="/wardrobe"
              className="motion-button mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
            >
              前往衣橱
            </Link>
          ) : null}
        </section>
      )}
    </div>
  );
}
