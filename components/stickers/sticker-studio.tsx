"use client";

import {
  Check,
  Heart,
  ImageOff,
  LoaderCircle,
  Shirt,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import { CATEGORY_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";

type StickerItem = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  cutoutUrl: string | null;
};

type StickerStudioProps = {
  day: string;
  error: string | null;
  favoriteIds: string[];
  items: StickerItem[];
  storageKey: string;
};

type ItemStatus = "idle" | "processing" | "done" | "error";
type Source = "all" | "favorites";

const MAX_SELECTION = 8;
const rotations = [
  "-4deg",
  "2deg",
  "-1deg",
  "4deg",
  "-3deg",
  "1deg",
  "3deg",
  "-2deg",
];
const shifts = ["3%", "-2%", "1%", "-3%", "2%", "0%", "-1%", "3%"];

function displayDate(day: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00.000Z`));
}

export function StickerStudio({
  day,
  error,
  favoriteIds,
  items,
  storageKey,
}: StickerStudioProps) {
  const router = useRouter();
  const [source, setSource] = useState<Source>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentItems, setCurrentItems] = useState(items);
  const [hydrated, setHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [notice, setNotice] = useState<string | null>(error);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const itemMap = useMemo(
    () => new Map(currentItems.map((item) => [item.id, item])),
    [currentItems],
  );
  const selectedItems = selectedIds.flatMap((id) => {
    const item = itemMap.get(id);
    return item ? [item] : [];
  });
  const sourceItems =
    source === "favorites"
      ? currentItems.filter((item) => favoriteSet.has(item.id))
      : currentItems;
  const pendingItems = selectedItems.filter((item) => !item.cutoutUrl);

  useEffect(() => {
    const available = new Set(items.map((item) => item.id));
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(stored)) {
        setSelectedIds(
          stored
            .filter(
              (id): id is string => typeof id === "string" && available.has(id),
            )
            .slice(0, MAX_SELECTION),
        );
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
    setHydrated(true);
  }, [items, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(selectedIds));
  }, [hydrated, selectedIds, storageKey]);

  function toggleItem(id: string) {
    if (isGenerating) return;
    setNotice(null);
    setSelectedIds((current) => {
      if (current.includes(id))
        return current.filter((itemId) => itemId !== id);
      if (current.length >= MAX_SELECTION) {
        setNotice("一次最多选择 8 件，先完成这一组贴纸吧。");
        return current;
      }
      return [...current, id];
    });
  }

  async function generateStickers() {
    if (pendingItems.length === 0) {
      setNotice(
        selectedItems.length === 0
          ? "先从下方选择今天想做成贴纸的衣物。"
          : "这组衣物都已经是贴纸了。",
      );
      return;
    }

    setIsGenerating(true);
    setNotice(null);
    setProgress({ completed: 0, total: pendingItems.length });
    let attempted = 0;
    let succeeded = 0;
    let failed = 0;
    let providerUnavailable = false;

    for (const item of pendingItems) {
      setStatuses((current) => ({ ...current, [item.id]: "processing" }));
      try {
        const response = await fetch(`/api/stickers/items/${item.id}`, {
          method: "POST",
          credentials: "same-origin",
        });
        const result = (await response.json()) as {
          cutoutUrl?: string;
          error?: string;
        };
        if (!response.ok || !result.cutoutUrl) {
          failed += 1;
          setStatuses((current) => ({ ...current, [item.id]: "error" }));
          if (response.status === 503) {
            providerUnavailable = true;
          }
        } else {
          succeeded += 1;
          setCurrentItems((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? { ...entry, cutoutUrl: result.cutoutUrl ?? null }
                : entry,
            ),
          );
          setStatuses((current) => ({ ...current, [item.id]: "done" }));
        }
      } catch {
        failed += 1;
        setStatuses((current) => ({ ...current, [item.id]: "error" }));
      }
      attempted += 1;
      setProgress({ completed: attempted, total: pendingItems.length });
      if (providerUnavailable) break;
    }

    setIsGenerating(false);
    setNotice(
      providerUnavailable
        ? "专业贴纸服务暂时不可用，原图已保留，可以稍后重试。"
        : failed > 0
          ? `${succeeded} 件已完成，${failed} 件可稍后重试。`
          : `${succeeded} 件衣物贴纸已经做好。`,
    );
    router.refresh();
  }

  const progressRatio =
    progress.total > 0 ? progress.completed / progress.total : 0;

  return (
    <div className="page-enter px-5 pt-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="app-page-meta">{displayDate(day)}</p>
          <h1 className="app-page-title mt-2">衣物贴纸册</h1>
          <p className="app-page-lead mt-3 max-w-[18rem]">
            挑出今天想穿或喜欢的衣物，做成白边贴纸。
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--fashion-lime)] text-[#1d1d1f] shadow-[0_12px_28px_rgba(92,105,39,0.16)]">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
      </header>

      <section
        aria-label="今天的衣物贴纸板"
        className="sticker-studio-board relative mt-6 min-h-[20rem] overflow-hidden rounded-[2rem] border border-white/70 p-4"
      >
        {selectedItems.length > 0 ? (
          <div className="relative z-10 grid min-h-[18rem] grid-cols-3 place-items-center gap-x-1 gap-y-2 py-2">
            {selectedItems.map((item, index) => (
              <div
                key={item.id}
                className="sticker-board-piece relative aspect-square w-full max-w-28"
              >
                <div
                  className="sticker-board-piece-inner relative size-full"
                  style={
                    {
                      "--sticker-rotation": rotations[index],
                      "--sticker-shift": shifts[index],
                    } as React.CSSProperties
                  }
                >
                  {item.cutoutUrl || item.imageUrl ? (
                    <GarmentSticker
                      alt={item.name}
                      imageUrl={item.imageUrl}
                      cutoutUrl={item.cutoutUrl}
                      sizes="112px"
                      surface={item.cutoutUrl ? "loose" : "card"}
                      className="size-full rounded-[1.1rem]"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center rounded-[1.1rem] bg-white/55 text-[var(--text-tertiary)]">
                      <ImageOff className="size-5" aria-hidden="true" />
                    </span>
                  )}
                  {!item.cutoutUrl ? (
                    <span className="absolute -bottom-1 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-1 text-[0.62rem] font-semibold text-[var(--text-secondary)] shadow-sm">
                      {statuses[item.id] === "processing"
                        ? "生成中"
                        : statuses[item.id] === "error"
                          ? "可重试"
                          : "待生成"}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative z-10 flex min-h-[18rem] flex-col items-center justify-center px-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/68 text-[#715c86] shadow-[0_12px_28px_rgba(81,59,104,0.1)]">
              <Shirt className="size-6" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="app-section-title mt-5">今天想贴哪几件？</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              从下方选衣服，这里会自动排成一张贴纸板。
            </p>
          </div>
        )}
      </section>

      <section className="surface-card mt-4 rounded-[1.5rem] p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-[var(--foreground)]">
            已选 {selectedItems.length}/{MAX_SELECTION}
          </span>
          <span className="text-[var(--text-tertiary)]">
            {pendingItems.length > 0
              ? `${pendingItems.length} 件等待生成`
              : selectedItems.length > 0
                ? "全部就绪"
                : "选择后开始"}
          </span>
        </div>

        {isGenerating ? (
          <div className="mt-3" aria-live="polite">
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div
                className="h-full origin-left rounded-full bg-[var(--fashion-lilac)] transition-transform duration-300"
                style={{ transform: `scaleX(${progressRatio})` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              正在生成 {Math.min(progress.completed + 1, progress.total)}/
              {progress.total}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={generateStickers}
          disabled={isGenerating || selectedItems.length === 0}
          className="motion-button mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isGenerating ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {isGenerating
            ? "正在制作贴纸"
            : pendingItems.length > 0
              ? `生成 ${pendingItems.length} 张贴纸`
              : selectedItems.length > 0
                ? "贴纸已经就绪"
                : "选择衣物后生成"}
        </button>

        {notice ? (
          <p
            className="mt-3 rounded-[1rem] bg-[var(--fashion-lilac-soft)] px-3 py-2.5 text-xs leading-5 text-[var(--text-secondary)]"
            aria-live="polite"
          >
            {notice}
          </p>
        ) : null}
      </section>

      <nav
        aria-label="贴纸衣物来源"
        className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-[var(--surface-soft)] p-1"
      >
        <SourceButton
          active={source === "all"}
          icon={Shirt}
          label="今日想穿"
          onClick={() => setSource("all")}
        />
        <SourceButton
          active={source === "favorites"}
          icon={Heart}
          label="我的喜欢"
          onClick={() => setSource("favorites")}
        />
      </nav>

      {sourceItems.length > 0 ? (
        <section className="mt-4 grid grid-cols-2 gap-3" aria-label="可选衣物">
          {sourceItems.map((item, index) => {
            const selected = selectedIds.includes(item.id);
            const status = statuses[item.id] ?? "idle";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                disabled={isGenerating}
                aria-pressed={selected}
                className={`sticker-selectable pressable relative min-h-44 overflow-hidden rounded-[1.5rem] border p-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--system-blue)] disabled:cursor-wait ${
                  selected
                    ? "border-[#8a70a1] bg-[var(--fashion-lilac-soft)] shadow-[0_14px_32px_rgba(81,59,104,0.13)]"
                    : "border-[var(--hairline)] bg-[var(--surface-solid)]"
                }`}
              >
                <span className="relative block aspect-square w-full">
                  {item.cutoutUrl || item.imageUrl ? (
                    <GarmentSticker
                      alt={item.name}
                      imageUrl={item.imageUrl}
                      cutoutUrl={item.cutoutUrl}
                      sizes="168px"
                      eager={index < 2}
                      className="size-full rounded-[1.15rem]"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center rounded-[1.15rem] bg-[var(--surface-soft)] text-[var(--text-tertiary)]">
                      <ImageOff className="size-5" aria-hidden="true" />
                    </span>
                  )}
                </span>

                <span
                  className={`absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full border shadow-sm ${
                    selected
                      ? "border-[#705886] bg-[#705886] text-white"
                      : "border-white/80 bg-white/88 text-[var(--text-tertiary)]"
                  }`}
                  aria-hidden="true"
                >
                  {status === "processing" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : selected ? (
                    <Check className="size-4" strokeWidth={2.2} />
                  ) : (
                    <span className="text-base leading-none">+</span>
                  )}
                </span>

                <span className="mt-2 block truncate text-xs font-semibold text-[var(--foreground)]">
                  {item.name}
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-[0.65rem] text-[var(--text-tertiary)]">
                  <span>{optionLabel(CATEGORY_OPTIONS, item.category)}</span>
                  <span>
                    {item.cutoutUrl
                      ? "贴纸就绪"
                      : status === "error"
                        ? "生成失败"
                        : "待生成"}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="mt-4 rounded-[1.6rem] border border-dashed border-[var(--hairline-strong)] px-6 py-10 text-center">
          <Heart
            className="mx-auto size-5 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
          <h2 className="app-section-title mt-4">
            {source === "favorites" ? "还没有喜欢的单品" : "衣橱还是空的"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {source === "favorites"
              ? "在衣物详情点亮爱心，再回到这里制作贴纸。"
              : "先添加衣物，之后就能挑选每天的贴纸。"}
          </p>
        </section>
      )}
    </div>
  );
}

function SourceButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Shirt;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`motion-button flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold ${
        active
          ? "bg-[#1d1d1f] text-white shadow-[0_8px_22px_rgba(29,29,31,0.14)]"
          : "text-[var(--text-secondary)]"
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
