import type { Metadata } from "next";
import { CloudRain, CloudSun, Info, Shirt } from "lucide-react";
import Link from "next/link";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RecommendationControls } from "@/components/recommendations/recommendation-controls";
import { RecommendationViewTracker } from "@/components/recommendations/recommendation-view-tracker";
import { recommendationOccasionLabel } from "@/lib/recommendations/constants";
import {
  getRecommendationPageData,
  toRecommendationItem,
} from "@/lib/recommendations/data";
import { replacementCandidates } from "@/lib/feedback/replacement";

export const metadata: Metadata = { title: "今日推荐" };

function todayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: process.env.WEATHER_TIMEZONE?.trim() || "Asia/Shanghai",
  }).format(new Date());
}

export default async function RecommendationsPage() {
  const { error, items, recommendation, itemFavoriteIds, outfitFavoriteKeys } =
    await getRecommendationPageData();
  const WeatherIcon =
    recommendation && recommendation.weather.weatherCode >= 51
      ? CloudRain
      : CloudSun;

  return (
    <div className="page-enter px-5 pt-4">
      <header>
        <p className="text-xs font-semibold text-[var(--system-blue)]">
          {todayLabel()}，今日穿搭
        </p>
        <h1 className="mt-2 font-heading text-[2.75rem] leading-[1.02] font-bold tracking-[-0.07em] text-[var(--foreground)]">
          今天穿什么
        </h1>
        <p className="mt-3 max-w-[22rem] text-sm leading-6 text-[var(--text-secondary)]">
          用你的真实衣橱，结合天气和场合整理三种选择。
        </p>
      </header>

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
                  {recommendation.weather.source === "live"
                    ? "实时天气"
                    : "模拟天气"}
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {recommendation.weather.summary}，体感{" "}
                  {recommendation.weather.apparentTemperatureC}°C
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[0.68rem] font-medium text-white/76">
              {recommendation.source === "ai" ? "AI 推荐" : "规则推荐"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/12 pt-3 text-xs text-white/62">
            <span>{recommendationOccasionLabel(recommendation.occasion)}</span>
            <span>{(recommendation.generationMs / 1000).toFixed(1)} 秒</span>
          </div>
        </section>
      ) : null}

      <section className="mt-5">
        <RecommendationControls
          key={`${recommendation?.id ?? "new"}-${recommendation?.occasion ?? "commute"}-${recommendation?.weather.preset ?? "live"}`}
          defaultOccasion={recommendation?.occasion ?? "commute"}
          defaultWeatherPreset={recommendation?.weather.preset ?? "live"}
          hasRecommendation={Boolean(recommendation)}
        />
      </section>

      {error ? (
        <p className="motion-status mt-4 rounded-[1.1rem] bg-[#ff453a]/8 px-4 py-3 text-sm leading-6 text-[#b42318]">
          {error}
        </p>
      ) : null}

      {recommendation ? (
        <section className="mt-7 space-y-5" aria-label="今日三套推荐">
          <RecommendationViewTracker
            recommendationId={recommendation.id}
            version={recommendation.updatedAt}
          />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)]">
                今日方案
              </p>
              <h2 className="mt-1 font-heading text-[1.8rem] font-bold tracking-[-0.05em] text-[var(--foreground)]">
                三套，都来自你的衣橱
              </h2>
            </div>
            <span className="pb-1 text-xs text-[var(--text-tertiary)]">
              03 套
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
          <h2 className="mt-4 font-heading text-xl font-bold tracking-[-0.035em] text-[var(--foreground)]">
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
