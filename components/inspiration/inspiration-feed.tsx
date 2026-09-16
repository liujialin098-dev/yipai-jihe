import { Newspaper } from "lucide-react";
import { InspirationCard } from "@/components/inspiration/inspiration-card";
import { InspirationPreferences } from "@/components/inspiration/inspiration-preferences";
import type { FashionFeedData } from "@/lib/inspiration/data";

export function InspirationFeed({ data }: { data: FashionFeedData }) {
  return (
    <>
      <InspirationPreferences preferences={data.preferences} />
      {data.items.length > 0 ? (
        <section className="mt-6 grid gap-4" aria-label="穿搭新闻与趋势">
          {data.items.map((item, index) => (
            <div key={item.id}>
              {item.isDiscovery && !data.items[index - 1]?.isDiscovery && (
                <h2 className="app-section-title mb-3">发现更多</h2>
              )}
              <InspirationCard
                item={item}
                index={index}
                showUnread={data.preferences.unreadEnabled}
              />
            </div>
          ))}
        </section>
      ) : (
        <section className="mt-6 rounded-[1.65rem] border border-dashed border-[var(--hairline)] px-5 py-9 text-center">
          <Newspaper
            className="mx-auto size-5 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
          <h2 className="app-section-title mt-4">
            {data.sourceUnavailable ? "资讯暂时连接不上" : "暂时没有合适的内容"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {data.sourceUnavailable
              ? "请稍后重新载入。"
              : "可以调整灵感偏好，或稍后再来看看。"}
          </p>
        </section>
      )}
    </>
  );
}
