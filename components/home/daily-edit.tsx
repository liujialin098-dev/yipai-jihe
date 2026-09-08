import { ArrowRight, Check, Plus, Shirt } from "lucide-react";
import Link from "next/link";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import { WeatherPanel } from "@/components/recommendations/weather-panel";
import type { DiaryEntryView } from "@/lib/diary/data";
import { homeDiaryItem, homeLookPositions } from "@/lib/home/presentation";
import type { RecommendationPageData } from "@/lib/recommendations/data";
import type { WardrobeItem } from "@/lib/wardrobe/data";

function ClothingComposition({
  items,
  recommended,
}: {
  items: WardrobeItem[];
  recommended: boolean;
}) {
  const positions = homeLookPositions(items.length);
  return (
    <figure
      className="home-look-composition"
      aria-label={
        recommended ? "今日推荐的真实衣物" : "衣橱单品预览，尚未生成搭配"
      }
    >
      {items.map((item, index) => {
        const position = positions[index];
        if (!position) return null;
        return (
          <div
            key={item.id}
            className="home-look-piece"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${position.width}%`,
              height: `${position.height}%`,
              transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
            }}
          >
            {item.imageUrl || item.cutoutUrl ? (
              <GarmentSticker
                imageUrl={item.imageUrl}
                cutoutUrl={item.cutoutUrl}
                alt={item.name}
                sizes="(max-width: 480px) 40vw, 180px"
                eager={index < 2}
                surface="loose"
                className="size-full"
                imageClassName="object-contain"
              />
            ) : (
              <span className="home-missing-photo">{item.name}</span>
            )}
          </div>
        );
      })}
    </figure>
  );
}

export function DailyEdit({
  data,
  entries,
  diaryError,
  days,
  anonymous,
}: {
  data: RecommendationPageData;
  entries: DiaryEntryView[];
  diaryError: boolean;
  days: string[];
  anonymous: boolean;
}) {
  const outfit = data.recommendation?.outfits[0];
  const items = outfit
    ? outfit.itemIds.flatMap((id) => {
        const item = data.items.find((candidate) => candidate.id === id);
        return item ? [item] : [];
      })
    : data.items.slice(0, 3);
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
        <h1 className="app-page-title app-page-title-home">今天穿什么</h1>
        <p className="home-edit-date">{dateLabel}</p>
        <WeatherPanel
          key={`${data.viewerId}-${data.weatherCity}-${data.targetDate}`}
          targetDay="today"
          targetDate={data.targetDate}
          city={data.weatherCity}
          compact
        />
      </header>
      <section aria-label="今日穿搭" className="home-edit-feature">
        {items.length ? (
          <ClothingComposition items={items} recommended={Boolean(outfit)} />
        ) : (
          <div className="home-look-empty">
            <Shirt size={64} strokeWidth={1} aria-hidden="true" />
          </div>
        )}
        <div className="home-look-caption">
          <h2>
            {outfit?.title ??
              (data.error
                ? "稍后再看看衣橱"
                : empty
                  ? "从第一件喜欢的衣服开始"
                  : "今天，让衣橱有新意")}
          </h2>
          {!outfit ? (
            <p>
              {data.error
                ? "暂时未能读取，请重试。"
                : empty
                  ? "拍一张照片，把它放进衣橱。"
                  : "衣橱单品 · 还未生成今日搭配"}
            </p>
          ) : null}
          <Link
            href={empty ? "/wardrobe/new" : "/recommendations?day=today"}
            className="motion-button home-edit-action"
          >
            {outfit
              ? "看这套搭配"
              : data.error
                ? "重新查看"
                : empty
                  ? "添加第一件"
                  : "搭一套"}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="home-journal" aria-labelledby="home-journal-title">
        <div className="home-journal-heading">
          <h2 id="home-journal-title">我的穿搭手帐</h2>
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
      {anonymous ? (
        <Link href="/settings#account" className="home-save-account">
          保存我的衣橱 <ArrowRight size={13} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
