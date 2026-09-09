import { Check, Circle } from "lucide-react";
import { ReadingControls } from "@/components/inspiration/reading-controls";
import { ImpressionTracker } from "@/components/inspiration/impression-tracker";
import type { FashionFeedCard } from "@/lib/inspiration/data";
import { FASHION_TOPIC_LABELS } from "@/lib/inspiration/validation";

const topicTone = {
  trend: "var(--fashion-lilac-soft)",
  color: "var(--fashion-coral-soft)",
  item: "var(--fashion-lime-soft)",
  occasion: "var(--fashion-sky-soft)",
  seasonal: "var(--fashion-lime-soft)",
  weather: "var(--fashion-sky-soft)",
} as const;

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function InspirationCard({
  item,
  index,
  showUnread = true,
}: {
  item: FashionFeedCard;
  index: number;
  showUnread?: boolean;
}) {
  return (
    <article
      className="surface-card stagger-item overflow-hidden rounded-[1.65rem]"
      style={{ "--stagger": Math.min(index, 6) } as React.CSSProperties}
    >
      <div className="h-2" style={{ background: topicTone[item.topic] }} />
      <div className="p-5">
        <ImpressionTracker id={item.id} />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                className="rounded-full px-2.5 py-1"
                style={{ background: topicTone[item.topic] }}
              >
                {FASHION_TOPIC_LABELS[item.topic]}
              </span>
              <span className="text-[var(--text-secondary)]">标题速览</span>
            </div>
            <h2 className="app-card-title mt-3">{item.title}</h2>
          </div>
          {showUnread && (
            <span
              className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${
                item.isRead
                  ? "bg-[var(--surface-soft)] text-[var(--text-tertiary)]"
                  : "bg-[#1d1d1f] text-white"
              }`}
            >
              <span className="sr-only">{item.isRead ? "已读" : "未读"}</span>
              {item.isRead ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Circle className="size-2.5 fill-current" aria-hidden="true" />
              )}
            </span>
          )}
        </div>

        <footer className="mt-4 flex flex-col gap-3 border-t border-[var(--hairline)] pt-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span className="break-words font-semibold">{item.sourceName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={item.publishedAt}>
              {dateFormatter.format(new Date(item.publishedAt))}
            </time>
          </div>
          <ReadingControls
            id={item.id}
            isRead={item.isRead}
            sourceUrl={item.sourceUrl}
            sourceName={item.sourceName}
          />
        </footer>
      </div>
    </article>
  );
}
