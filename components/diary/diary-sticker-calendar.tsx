import { ArrowLeft, ArrowRight, Shirt } from "lucide-react";
import Link from "next/link";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import type { DiaryEntryView } from "@/lib/diary/data";
import { shiftMonth } from "@/lib/diary/validation";

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

function monthCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  return [
    ...Array.from({ length: mondayOffset }, (_, index) => ({
      day: null,
      key: `leading-${index + 1}`,
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

export function DiaryStickerCalendar({
  entries,
  month,
  today,
}: {
  entries: DiaryEntryView[];
  month: string;
  today: string;
}) {
  const entryMap = new Map(entries.map((entry) => [entry.worn_on, entry]));
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const canMoveNext = nextMonth <= today.slice(0, 7);

  return (
    <section className="mt-6" aria-label={`${formatMonth(month)}穿搭日历`}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/diary?view=diary&month=${previousMonth}`}
          className="pressable flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)]"
          aria-label="查看上个月"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <div className="text-center">
          <h2 className="app-section-title">{formatMonth(month)}</h2>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            已记录 {entries.length} 天
          </p>
        </div>
        {canMoveNext ? (
          <Link
            href={`/diary?view=diary&month=${nextMonth}`}
            className="pressable flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)]"
            aria-label="查看下个月"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="size-11" aria-hidden="true" />
        )}
      </div>

      <div className="sticker-month-card mt-4 overflow-hidden rounded-[1.8rem] p-3">
        <div className="grid grid-cols-7 pb-2 text-center text-[0.62rem] font-semibold text-[var(--text-tertiary)]">
          {["一", "二", "三", "四", "五", "六", "日"].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {monthCells(month).map(({ day, key }) => {
            if (!day) {
              return <span key={key} className="aspect-[0.78]" />;
            }
            const date = isoDay(month, day);
            const entry = entryMap.get(date);
            const representative = entry?.items.find(
              (item) => item.current?.cutoutUrl || item.current?.imageUrl,
            );
            const isFuture = date > today;
            const content = (
              <span
                key={date}
                className={`sticker-calendar-day relative flex aspect-[0.78] min-w-0 flex-col items-center rounded-[0.9rem] px-0.5 pt-1 ${date === today ? "sticker-calendar-day-today" : ""}`}
              >
                <span className="text-[0.58rem] font-semibold text-[var(--text-secondary)]">
                  {day}
                </span>
                {representative?.current ? (
                  <span className="relative mt-0.5 block size-[2.15rem] max-w-full">
                    <GarmentSticker
                      imageUrl={representative.current.imageUrl}
                      cutoutUrl={representative.current.cutoutUrl}
                      alt=""
                      sizes="40px"
                      surface={
                        representative.current.cutoutUrl ? "loose" : "card"
                      }
                      className="size-full rounded-[0.55rem]"
                    />
                    {entry && entry.items.length > 1 ? (
                      <span className="absolute -right-1 -top-1 z-20 flex size-4 items-center justify-center rounded-full bg-[var(--control-primary)] text-[0.5rem] font-bold text-[var(--control-primary-foreground)] shadow-sm">
                        {entry.items.length}
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
                  entry ? `${date}，编辑当日单品` : `${date}，添加一件单品`
                }
                className="rounded-[0.9rem] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--system-blue)]"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
