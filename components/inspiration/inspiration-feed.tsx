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
            <InspirationCard
              key={item.id}
              item={item}
              index={index}
              showUnread={data.preferences.unreadEnabled}
              personalized={data.preferences.personalized}
            />
          ))}
        </section>
      ) : (
        <section className="mt-6 rounded-[1.65rem] border border-dashed border-[var(--hairline)] px-5 py-9 text-center">
          <Newspaper
            className="mx-auto size-5 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
          <h2 className="app-section-title mt-4">今天没有合适的新内容</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            暂无新内容，请稍后重试或调整主题。
          </p>
        </section>
      )}
    </>
  );
}
