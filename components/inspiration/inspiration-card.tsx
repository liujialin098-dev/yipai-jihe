import { Check, Circle } from "lucide-react";
import { ReadingControls } from "@/components/inspiration/reading-controls";
import { ImpressionTracker } from "@/components/inspiration/impression-tracker";
import { ContentDetails } from "@/components/inspiration/content-details";
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
  personalized = true,
}: {
  item: FashionFeedCard;
  index: number;
  showUnread?: boolean;
  personalized?: boolean;
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
            <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold">
              <span
                className="rounded-full px-2.5 py-1"
                style={{ background: topicTone[item.topic] }}
              >
                {FASHION_TOPIC_LABELS[item.topic]}
              </span>
              <span className="text-[var(--text-tertiary)]">
                {dateFormatter.format(new Date(item.publishedAt))}
              </span>
            </div>
            <h2 className="app-card-title mt-3 text-[1.16rem]">{item.title}</h2>
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

        <p className="mt-4 text-xs font-semibold text-[var(--text-tertiary)]">
          {item.summaryKind === "source-summary"
            ? "来源标题简述 · 非全文摘要"
            : "阅读提示 · 中文简述暂不可用"}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {item.summary}
        </p>
        <div className="mt-4 rounded-[1.1rem] bg-[var(--surface-soft)] px-3.5 py-3">
          <p className="text-[0.67rem] font-semibold text-[var(--foreground)]">
            {personalized ? "为什么给你看" : "展示顺序"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            {item.reason}
          </p>
        </div>

        <ContentDetails id={item.id} isRead={item.isRead}>
          <div className="space-y-2 break-words leading-5">
            <p>原始标题：{item.originalTitle ?? item.title}</p>
            <p>来源发布：{dateFormatter.format(new Date(item.publishedAt))}</p>
            <p>
              展示有效期至：{dateFormatter.format(new Date(item.validUntil))}
            </p>
            {item.fetchedAt && (
              <p>
                来源获取：{dateFormatter.format(new Date(item.fetchedAt))}
                ；缓存每日更新，超过一天仍未更新时可能是来源暂不可达。
              </p>
            )}
            <p>
              仅整理来源提供的标题信息，不代表阅读全文。原文中的广告和购买链接不代表本站推荐。
            </p>
          </div>
        </ContentDetails>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--hairline)] pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--foreground)]">
              {item.sourceName}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-[var(--text-tertiary)]">
              外链将离开衣拍即合
            </p>
          </div>
          <ReadingControls
            id={item.id}
            isRead={item.isRead}
            sourceUrl={item.sourceUrl}
            sourceName={item.sourceName}
          />
        </div>
      </div>
    </article>
  );
}
