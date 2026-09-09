import { ArrowRight, Check, Plus, Shirt, Sticker } from "lucide-react";
import Link from "next/link";
import { HomeCollage } from "@/components/home/home-collage";
import { RoundedIcon } from "@/components/ui/rounded-icon";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import { WeatherPanel } from "@/components/recommendations/weather-panel";
import type { DiaryEntryView } from "@/lib/diary/data";
import { homeDiaryItem, homePreviewItems } from "@/lib/home/presentation";
import type { RecommendationPageData } from "@/lib/recommendations/data";

export function DailyEdit({
  data,
  entries,
  diaryError,
  days,
  anonymous,
  displayName,
}: {
  data: RecommendationPageData;
  entries: DiaryEntryView[];
  diaryError: boolean;
  days: string[];
  anonymous: boolean;
  displayName: string;
}) {
  const outfit = data.recommendation?.outfits[0];
  const sourceItems = data.items;
  const items = homePreviewItems(sourceItems);
  const pendingCount = sourceItems.filter((item) => !item.cutoutUrl).length;
  const needsStickers = !data.error && !items.length && data.items.length > 0;
  const empty = !data.error && data.items.length === 0;
  const today = days[days.length - 1];
  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${data.targetDate}T12:00:00Z`));
  return (
    <div className="page-enter home-daily-edit px-5 pt-4">
      <header className="home-edit-heading">
        <h1 className="app-page-title app-page-title-home home-greeting">
          <span className="brand-name-english home-greeting-hello">Hello,</span>{" "}
          <span className="home-greeting-name">
            {displayName.trim() || "朋友"}
          </span>
        </h1>
        <div className="home-edit-meta">
          <time className="home-edit-date" dateTime={data.targetDate}>
            {dateLabel}
          </time>
          <WeatherPanel
            key={`${data.viewerId}-${data.weatherCity}-${data.targetDate}`}
            targetDay="today"
            targetDate={data.targetDate}
            city={data.weatherCity}
            compact
          />
        </div>
      </header>
      <section aria-label="今日穿搭" className="home-edit-feature">
        {items.length && data.viewerId ? (
          <HomeCollage
            key={data.viewerId}
            viewerId={data.viewerId}
            items={sourceItems
              .filter((item) => item.cutoutUrl)
              .map(({ id, name, category, imageUrl, cutoutUrl }) => ({
                id,
                name,
                category,
                imageUrl,
                cutoutUrl,
              }))}
          />
        ) : (
          <div className="home-look-empty">
            {needsStickers ? (
              <Sticker size={48} strokeWidth={1} aria-hidden="true" />
            ) : (
              <Shirt size={64} strokeWidth={1} aria-hidden="true" />
            )}
          </div>
        )}
        <div className="home-look-caption">
          {outfit && !needsStickers ? <p>今日推荐</p> : null}
          <h2 className="app-section-title">
            {needsStickers
              ? "把喜欢的衣服，拼在一起"
              : (outfit?.title ??
                (data.error
                  ? "稍后再看看衣橱"
                  : empty
                    ? "从第一件喜欢的衣服开始"
                    : "今天，让衣橱有新意"))}
          </h2>
          {needsStickers ? (
            <p>先把喜欢的衣物做成贴纸。</p>
          ) : !outfit ? (
            <p>
              {data.error
                ? "暂时未能读取，请重试。"
                : empty
                  ? "拍一张照片，把它放进衣橱。"
                  : "衣橱单品 · 还未生成今日搭配"}
            </p>
          ) : null}
          <Link
            href={
              empty
                ? "/wardrobe/new"
                : needsStickers
                  ? "/stickers"
                  : "/recommendations?day=today"
            }
            className="motion-button home-edit-action"
          >
            {needsStickers
              ? "制作衣物贴纸"
              : outfit
                ? "看这套搭配"
                : data.error
                  ? "重新查看"
                  : empty
                    ? "添加第一件"
                    : "搭一套"}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          {items.length > 0 && pendingCount > 0 ? (
            <Link href="/stickers" className="home-complete-stickers">
              {outfit ? `还有 ${pendingCount} 件待制作` : "制作更多衣物贴纸"}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </section>
      <Link href="/wardrobe" className="home-wardrobe-entry" prefetch={false}>
        <span className="home-wardrobe-symbol">
          <RoundedIcon name="wardrobe" />
        </span>
        <span>
          <strong>我的衣橱</strong>
          <small>{sourceItems.length} 件衣物</small>
        </span>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
      <section className="home-journal" aria-labelledby="home-journal-title">
        <div className="home-journal-heading">
          <h2 id="home-journal-title" className="app-section-title">
            我的穿搭手帐
          </h2>
          <Link href="/diary?view=diary" className="home-journal-more">
            全部 <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {diaryError ? (
          <p className="home-journal-error">
            记录暂时未能读取，请打开手帐重试。
          </p>
        ) : (
          <div className="home-journal-days">
            {days.map((date) => {
              const entry = entries.find(
                (candidate) => candidate.worn_on === date,
              );
              const item = entry
                ? homeDiaryItem(
                    entry.item_ids,
                    data.items,
                    data.itemFavoriteIds,
                  )
                : null;
              return (
                <Link
                  key={date}
                  href={`/diary/new?date=${date}`}
                  className="home-journal-day"
                  data-today={date === today}
                  aria-label={`${date}，${entry ? `编辑记录：${item?.name ?? entry.title}` : "添加单品"}`}
                >
                  <span className="home-journal-sticker">
                    {item && (item.imageUrl || item.cutoutUrl) ? (
                      <GarmentSticker
                        imageUrl={item.imageUrl}
                        cutoutUrl={item.cutoutUrl}
                        alt={item.name}
                        sizes="72px"
                        surface="loose"
                        className="size-full"
                        imageClassName="object-contain"
                      />
                    ) : entry ? (
                      <Check size={19} aria-hidden="true" />
                    ) : (
                      <Plus size={19} strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </span>
                  <span className="home-journal-date">
                    {date === today
                      ? "今天"
                      : `${Number(date.slice(5, 7))}.${Number(date.slice(8))}`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <Link href="/inspiration" prefetch={false} className="home-daily-feed">
        <span className="home-daily-feed-icon">
          <RoundedIcon name="inspiration" />
        </span>
        <span className="home-daily-feed-copy">
          <strong>每日推送</strong>
          <span>发现穿搭灵感与时尚资讯</span>
        </span>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
      {anonymous ? (
        <Link href="/settings#account" className="home-save-account">
          保存我的衣橱 <ArrowRight size={13} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
