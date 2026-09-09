import type { Metadata } from "next";
import {
  ImageOff,
  Layers3,
  PenLine,
  Plus,
  Shirt,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { redirect } from "next/navigation";
import { DiaryDeleteButton } from "@/components/diary/diary-delete-button";
import { DiaryStickerCalendar } from "@/components/diary/diary-sticker-calendar";
import { FavoritesPanel } from "@/components/diary/favorites-panel";
import { UtilizationStickerWall } from "@/components/diary/utilization-sticker-wall";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import {
  getDiaryMonthData,
  getDiaryReportData,
  type DiaryEntryView,
} from "@/lib/diary/data";
import type { DiaryItemUtilization } from "@/lib/diary/report";
import { parseDiaryRange, type DiaryRange } from "@/lib/diary/validation";
import {
  CATEGORY_OPTIONS,
  OCCASION_OPTIONS,
  optionLabel,
} from "@/lib/wardrobe/constants";

export const metadata: Metadata = { title: "穿搭记录" };

type DiaryView = "diary" | "favorites" | "report";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function reportHref(range: DiaryRange) {
  return `/diary?view=report&range=${range}`;
}

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    range?: string | string[];
    view?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const view: DiaryView =
    params.view === "report"
      ? "report"
      : params.view === "favorites"
        ? "favorites"
        : "diary";
  const range = parseDiaryRange(params.range);
  const monthData =
    view === "diary" ? await getDiaryMonthData(params.month) : null;
  const reportData = view === "report" ? await getDiaryReportData(range) : null;
  if ((view === "diary" && !monthData) || (view === "report" && !reportData)) {
    redirect("/");
  }

  return (
    <div className="page-enter px-5 pt-4">
      <PageHeading title="日记与收藏" />

      <nav
        aria-label="穿搭记录视图"
        className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-[var(--surface-soft)] p-1"
      >
        <ViewLink href="/diary?view=diary" active={view === "diary"}>
          日记
        </ViewLink>
        <ViewLink href="/diary?view=favorites" active={view === "favorites"}>
          收藏
        </ViewLink>
        <ViewLink href={reportHref(range)} active={view === "report"}>
          利用率
        </ViewLink>
      </nav>

      {view !== "report" ? <StickerWorkspaceEntry /> : null}

      {view === "diary" && monthData ? (
        <DiaryHistory
          entries={monthData.entries}
          error={monthData.error}
          month={monthData.month}
          today={monthData.today}
        />
      ) : view === "favorites" ? (
        <FavoritesPanel />
      ) : reportData ? (
        <UtilizationReport
          error={reportData.error}
          range={range}
          recentStickerItems={reportData.recentStickerItems}
          report={reportData.report}
        />
      ) : null}
    </div>
  );
}

function StickerWorkspaceEntry() {
  return (
    <Link
      href="/stickers"
      className="sticker-diary-entry pressable relative mt-5 flex min-h-24 items-center justify-between overflow-hidden rounded-[1.7rem] px-5 py-4"
    >
      <div className="relative z-10">
        <p className="text-[0.66rem] font-semibold tracking-[0.08em] text-[var(--text-secondary)]">
          STICKER STUDIO
        </p>
        <p className="mt-1 text-lg font-bold tracking-[-0.03em]">
          制作贴纸画板
        </p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          移动、裁切、叠放并分享
        </p>
      </div>
      <span className="relative z-10 flex size-12 items-center justify-center rounded-[1rem] bg-[var(--action-purple)] text-white shadow-[0_10px_24px_rgba(70,50,88,0.2)]">
        <Layers3 className="size-5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function ViewLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`motion-button flex h-11 items-center justify-center rounded-full text-sm font-semibold ${
        active
          ? "bg-[#1d1d1f] text-white shadow-[0_8px_22px_rgba(29,29,31,0.16)]"
          : "text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </Link>
  );
}

function DiaryHistory({
  entries,
  error,
  month,
  today,
}: {
  entries: DiaryEntryView[];
  error: string | null;
  month: string;
  today: string;
}) {
  return (
    <>
      <DiaryStickerCalendar entries={entries} month={month} today={today} />

      <Link
        href="/diary/new"
        className="motion-button mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
      >
        <Plus className="size-4" aria-hidden="true" />
        添加一件单品
      </Link>

      {error ? (
        <p className="mt-4 rounded-[1.1rem] bg-[#ff453a]/8 px-4 py-3 text-sm leading-6 text-[#b42318]">
          {error}
        </p>
      ) : entries.length > 0 ? (
        <section className="mt-6 space-y-5" aria-label="本月穿搭记录">
          {entries.map((entry, index) => (
            <DiaryEntryCard key={entry.id} entry={entry} index={index} />
          ))}
        </section>
      ) : (
        <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
          这个月还没有记录，点日期或上方按钮添加。
        </p>
      )}
    </>
  );
}

function DiaryEntryCard({
  entry,
  index,
}: {
  entry: DiaryEntryView;
  index: number;
}) {
  return (
    <article
      className="surface-card stagger-item overflow-hidden rounded-[1.7rem]"
      style={{ "--stagger": Math.min(index, 8) } as React.CSSProperties}
    >
      <div className="grid min-h-48 grid-cols-2 gap-2 bg-[var(--surface-soft)] p-3">
        {entry.items.slice(0, 4).map((item, itemIndex) => (
          <div
            key={`${entry.id}-${item.id}`}
            className={`relative overflow-hidden rounded-[1.1rem] bg-[var(--surface-solid)] ${
              entry.items.length % 2 === 1 && itemIndex === 0
                ? "row-span-2 min-h-44"
                : "min-h-24"
            }`}
          >
            {item.current?.cutoutUrl || item.current?.imageUrl ? (
              <GarmentSticker
                imageUrl={item.current.imageUrl}
                cutoutUrl={item.current.cutoutUrl}
                alt={item.name}
                sizes="(max-width: 480px) 44vw, 210px"
                className="size-full rounded-[1.1rem]"
              />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-[var(--text-tertiary)]">
                <ImageOff className="size-4" aria-hidden="true" />
                {item.name}
              </span>
            )}
            {itemIndex === 3 && entry.items.length > 4 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                +{entry.items.length - 3}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-page-meta">{formatDate(entry.worn_on)}</p>
            <h2 className="app-card-title mt-1">{entry.title}</h2>
          </div>
          <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-[0.68rem] font-medium text-[var(--text-secondary)]">
            {optionLabel(OCCASION_OPTIONS, entry.occasion)}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">
          {entry.source === "recommendation" ? "来自今日推荐" : "手工记录"} ·{" "}
          {entry.items.length} 件衣物
        </p>
        {entry.note ? (
          <p className="mt-3 rounded-[1rem] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
            {entry.note}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline)] pt-3">
          <Link
            href={`/diary/new?date=${entry.worn_on}`}
            className="motion-button inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--foreground)]"
          >
            <PenLine className="size-3.5" aria-hidden="true" />
            编辑
          </Link>
          <DiaryDeleteButton entryId={entry.id} />
        </div>
      </div>
    </article>
  );
}

function UtilizationReport({
  error,
  range,
  recentStickerItems,
  report,
}: {
  error: string | null;
  range: DiaryRange;
  recentStickerItems: DiaryItemUtilization[];
  report: NonNullable<Awaited<ReturnType<typeof getDiaryReportData>>>["report"];
}) {
  const rangeLabels: Record<DiaryRange, string> = {
    "30": "近 30 天",
    "90": "近 90 天",
    all: "全部",
  };

  return (
    <>
      <nav aria-label="利用率统计范围" className="mt-5 flex gap-2">
        {(["30", "90", "all"] as const).map((value) => (
          <Link
            key={value}
            href={reportHref(value)}
            aria-current={range === value ? "page" : undefined}
            className={`pressable flex min-h-9 flex-1 items-center justify-center rounded-full text-xs font-semibold ${
              range === value
                ? "bg-[#1d1d1f] text-white"
                : "border border-[var(--hairline)] bg-[var(--surface-solid)] text-[var(--text-secondary)]"
            }`}
          >
            {rangeLabels[value]}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="mt-4 rounded-[1.1rem] bg-[#ff453a]/8 px-4 py-3 text-sm leading-6 text-[#b42318]">
          {error}
        </p>
      ) : null}

      <UtilizationStickerWall items={recentStickerItems} />

      <section className="mt-6 overflow-hidden rounded-[1.75rem] bg-[#1d1d1f] p-5 text-white shadow-[0_18px_50px_rgba(29,29,31,0.2)]">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs text-white/58">
              {rangeLabels[range]}衣橱利用率
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold tracking-[-0.07em]">
              {report.utilizationRate}%
            </p>
          </div>
          <span className="flex size-12 items-center justify-center rounded-full bg-white/12">
            <TrendingUp className="size-5" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/62">
          当前日常衣橱 {report.activeItemCount} 件，其中 {report.usedItemCount}{" "}
          件在范围内有真实穿着记录。
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/12 pt-4">
          <ReportMetric label="记录天数" value={`${report.recordedDays} 天`} />
          <ReportMetric
            label="单品穿着"
            value={`${report.itemWearEvents} 次`}
          />
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <h2 className="app-section-title">最常穿</h2>
          <span className="text-xs text-[var(--text-tertiary)]">
            按实际记录统计
          </span>
        </div>
        {report.frequentItems.length > 0 ? (
          <div className="surface-card mt-4 divide-y divide-[var(--hairline)] overflow-hidden rounded-[1.55rem] px-4">
            {report.frequentItems.slice(0, 8).map((item) => (
              <UtilizationRow key={item.item.id} utilization={item} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.55rem] border border-dashed border-[var(--hairline-strong)] px-5 py-8 text-center">
            <Shirt
              className="mx-auto size-5 text-[var(--system-blue)]"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              这个范围还没有穿着记录。
            </p>
            <Link
              href="/diary/new"
              className="mt-3 inline-block text-sm font-semibold text-[var(--system-blue)]"
            >
              记录第一套
            </Link>
          </div>
        )}
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <h2 className="app-section-title">还没记录穿过</h2>
          <span className="text-xs text-[var(--text-tertiary)]">
            {report.unusedItems.length} 件
          </span>
        </div>
        {report.unusedItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {report.unusedItems.slice(0, 6).map((utilization) => (
              <Link
                key={utilization.item.id}
                href={`/wardrobe/${utilization.item.id}`}
                className="surface-card pressable min-w-0 rounded-[1.35rem] p-2.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[0.95rem] bg-[var(--surface-soft)]">
                  {utilization.item.cutoutUrl || utilization.item.imageUrl ? (
                    <GarmentSticker
                      imageUrl={utilization.item.imageUrl}
                      cutoutUrl={utilization.item.cutoutUrl}
                      alt={utilization.item.name}
                      sizes="(max-width: 480px) 44vw, 210px"
                      className="size-full rounded-[0.95rem]"
                    />
                  ) : (
                    <ImageOff
                      className="absolute inset-0 m-auto size-5 text-[var(--text-tertiary)]"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="mt-2 truncate px-1 text-xs font-semibold text-[var(--foreground)]">
                  {utilization.item.name}
                </p>
                <p className="mt-1 px-1 text-[0.65rem] text-[var(--text-tertiary)]">
                  {optionLabel(CATEGORY_OPTIONS, utilization.item.category)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="surface-card mt-4 rounded-[1.35rem] px-4 py-5 text-sm leading-6 text-[var(--text-secondary)]">
            当前日常衣橱里的衣物在这个范围内都记录穿过了。
          </p>
        )}
      </section>
    </>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white/8 px-3 py-3">
      <p className="text-[0.65rem] text-white/52">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function UtilizationRow({
  utilization,
}: {
  utilization: DiaryItemUtilization;
}) {
  const item = utilization.item;
  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="pressable flex min-h-20 items-center gap-3 py-3"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-[0.9rem] bg-[var(--surface-soft)]">
        {item.cutoutUrl || item.imageUrl ? (
          <GarmentSticker
            imageUrl={item.imageUrl}
            cutoutUrl={item.cutoutUrl}
            alt={item.name}
            sizes="56px"
            className="size-full rounded-[0.9rem]"
          />
        ) : (
          <ImageOff
            className="absolute inset-0 m-auto size-4 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {item.name}
        </p>
        <p className="mt-1 text-[0.68rem] text-[var(--text-tertiary)]">
          最近{" "}
          {utilization.lastWornOn
            ? formatDate(utilization.lastWornOn)
            : "未记录"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {utilization.wearCount} 次
        </p>
        <p className="mt-1 text-[0.65rem] text-[var(--system-blue)]">
          {utilization.status === "frequent" ? "常穿" : "已穿"}
        </p>
      </div>
    </Link>
  );
}
