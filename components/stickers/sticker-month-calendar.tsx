"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Shirt,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import { shiftMonth } from "@/lib/diary/validation";
import type { StickerCanvasWardrobeItem } from "@/components/stickers/sticker-canvas";

export type StickerCalendarEntry = {
  itemIds: string[];
  wornOn: string;
};

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1, 12)));
}

function monthCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  return [
    ...Array.from({ length: mondayOffset }, (_, offset) => ({
      day: null,
      key: `leading-${offset + 1}`,
    })),
    ...Array.from({ length: dayCount }, (_, index) => ({
      day: index + 1,
      key: `${month}-${index + 1}`,
    })),
  ];
}

function isoDay(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function StickerMonthCalendar({
  entries,
  favoriteIds,
  items,
  month,
  today,
}: {
  entries: StickerCalendarEntry[];
  favoriteIds: string[];
  items: StickerCanvasWardrobeItem[];
  month: string;
  today: string;
}) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const favoriteSet = new Set(favoriteIds);
  const entryMap = new Map(entries.map((entry) => [entry.wornOn, entry]));
  const representatives = entries.flatMap((entry) => {
    const visibleIds = entry.itemIds.filter((id) => itemMap.has(id));
    const representativeId =
      visibleIds.find((id) => favoriteSet.has(id)) ?? visibleIds[0];
    const item = representativeId ? itemMap.get(representativeId) : undefined;
    return item ? [{ entry, item }] : [];
  });
  const representativeByDay = new Map(
    representatives.map((value) => [value.entry.wornOn, value.item]),
  );
  const counts = new Map<string, number>();
  for (const { item } of representatives) {
    counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  }
  const mostFrequent = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([id, count]) => ({ count, item: itemMap.get(id) }))
    .find((value) => value.item);
  const montageItems = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .flatMap(([id]) => {
      const item = itemMap.get(id);
      return item ? [item] : [];
    });
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const canMoveNext = nextMonth <= today.slice(0, 7);

  return (
    <div className="mt-5">
      <section className="flex items-center justify-between gap-3">
        <Link
          href={`/stickers?view=calendar&month=${previousMonth}`}
          className="pressable flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)]"
          aria-label="查看上个月"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <div className="text-center">
          <h2 className="app-section-title">{formatMonth(month)}</h2>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            衣物贴纸月历
          </p>
        </div>
        {canMoveNext ? (
          <Link
            href={`/stickers?view=calendar&month=${nextMonth}`}
            className="pressable flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)]"
            aria-label="查看下个月"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="size-11" aria-hidden="true" />
        )}
      </section>

      <section
        className="sticker-month-card mt-5 overflow-hidden rounded-[1.8rem] p-3"
        aria-label={`${formatMonth(month)}贴纸日历`}
      >
        <div className="grid grid-cols-7 pb-2 text-center text-[0.62rem] font-semibold text-[var(--text-tertiary)]">
          {["一", "二", "三", "四", "五", "六", "日"].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {monthCells(month).map(({ day, key }) => {
            if (!day)
              return (
                <span key={key} className="aspect-[0.78]" aria-hidden="true" />
              );
            const date = isoDay(month, day);
            const entry = entryMap.get(date);
            const item = representativeByDay.get(date);
            const isToday = date === today;
            const isFuture = date > today;
            const content = (
              <span
                key={date}
                className={`sticker-calendar-day relative flex aspect-[0.78] min-w-0 flex-col items-center rounded-[0.9rem] px-0.5 pt-1 ${isToday ? "sticker-calendar-day-today" : ""}`}
              >
                <span className="text-[0.58rem] font-semibold text-[var(--text-secondary)]">
                  {day}
                </span>
                {item ? (
                  <span className="relative mt-0.5 block size-[2.15rem] max-w-full">
                    <GarmentSticker
                      imageUrl={item.imageUrl}
                      cutoutUrl={item.cutoutUrl}
                      alt=""
                      sizes="40px"
                      surface={item.cutoutUrl ? "loose" : "card"}
                      className="size-full rounded-[0.55rem]"
                    />
                    {entry && entry.itemIds.length > 1 ? (
                      <span className="absolute -right-1 -top-1 z-20 flex size-4 items-center justify-center rounded-full bg-[var(--control-primary)] text-[0.5rem] font-bold text-[var(--control-primary-foreground)] shadow-sm">
                        {entry.itemIds.length}
                      </span>
                    ) : null}
                  </span>
                ) : entry ? (
                  <Shirt
                    className="mt-2 size-4 text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            );
            return isFuture ? (
              <span key={date} title={`${date}，未来日期`}>
                {content}
              </span>
            ) : (
              <Link
                key={date}
                href={`/diary/new?date=${date}`}
                aria-label={
                  entry
                    ? `${date}，${entry.itemIds.length} 件衣物，编辑穿搭`
                    : `${date}，添加穿搭`
                }
                className="rounded-[0.9rem] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--system-blue)]"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      {montageItems.length > 0 ? (
        <section className="surface-card mt-4 rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                本月常驻
              </p>
              <h3 className="app-card-title mt-1">穿得多，也喜欢</h3>
            </div>
            <Sparkles
              className="size-5 text-[var(--system-blue)]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 grid min-h-36 grid-cols-4 place-items-center gap-1 rounded-[1.2rem] border border-[var(--hairline)] bg-[var(--surface-soft)] p-3">
            {montageItems.map((item, index) => (
              <div
                key={item.id}
                className="relative aspect-square w-full"
                style={{
                  transform: `rotate(${[-5, 4, -2, 6, 2, -6, 5, -3][index] ?? 0}deg)`,
                }}
              >
                <GarmentSticker
                  imageUrl={item.imageUrl}
                  cutoutUrl={item.cutoutUrl}
                  alt={item.name}
                  sizes="80px"
                  surface={item.cutoutUrl ? "loose" : "card"}
                  className="size-full rounded-[0.75rem]"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className="mt-4 grid grid-cols-2 gap-3"
        aria-label="月度贴纸统计"
      >
        <MonthlyMetric label="记录" value={`${entries.length} 天`} />
        <MonthlyMetric label="代表" value={`${counts.size} 件`} />
        <div className="surface-card col-span-2 rounded-[1.45rem] p-4">
          <p className="text-xs text-[var(--text-tertiary)]">最常出现</p>
          <div className="mt-2 flex items-center gap-3">
            {mostFrequent?.item ? (
              <div className="relative size-12 shrink-0">
                <GarmentSticker
                  imageUrl={mostFrequent.item.imageUrl}
                  cutoutUrl={mostFrequent.item.cutoutUrl}
                  alt=""
                  sizes="48px"
                  surface={mostFrequent.item.cutoutUrl ? "loose" : "card"}
                  className="size-full rounded-[0.7rem]"
                />
              </div>
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-soft)]">
                <CalendarDays
                  className="size-5 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {mostFrequent?.item?.name ?? "等待第一条记录"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {mostFrequent ? `${mostFrequent.count} 天` : "记录后自动出现"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {entries.length === 0 ? (
        <Link
          href="/diary/new"
          className="motion-button mt-4 flex min-h-12 items-center justify-center rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)]"
        >
          记录第一套穿搭
        </Link>
      ) : null}
    </div>
  );
}

function MonthlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-[1.45rem] p-4">
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-[-0.035em]">{value}</p>
    </div>
  );
}
