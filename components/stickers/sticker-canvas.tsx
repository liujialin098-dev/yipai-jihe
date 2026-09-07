"use client";

import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  Check,
  Download,
  ImageOff,
  LoaderCircle,
  Redo2,
  Share2,
  Trash2,
} from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import {
  STICKER_CANVAS_LIMITS,
  STICKER_CANVAS_THEMES,
  clampNumber,
  createInitialStickerCanvasItems,
  normalizeStickerStack,
  parseStoredStickerCanvas,
  reconcileStickerCanvasItems,
  stickerCanvasTheme,
  type StickerCanvasItem,
  type StickerCanvasTheme,
} from "@/lib/stickers/canvas";
import {
  exportStickerBoard,
  stickerBoardFilename,
} from "@/lib/stickers/export";

export type StickerCanvasWardrobeItem = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  cutoutUrl: string | null;
};

type DragState = {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

type Notice = { tone: "error" | "success" | "info"; text: string } | null;

function transformStyle(item: StickerCanvasItem, dx = 0, dy = 0) {
  return `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${item.rotation}deg)`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function StickerCanvas({
  day,
  items: selectedItems,
  onRemove,
  storageKey,
}: {
  day: string;
  items: StickerCanvasWardrobeItem[];
  onRemove: (id: string) => void;
  storageKey: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemElements = useRef(new Map<string, HTMLButtonElement>());
  const dragState = useRef<DragState | null>(null);
  const loadedStorageKey = useRef<string | null>(null);
  const [canvasItems, setCanvasItems] = useState<StickerCanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [theme, setTheme] = useState<StickerCanvasTheme>("lilac");
  const [exporting, setExporting] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const wardrobeMap = useMemo(
    () => new Map(selectedItems.map((item) => [item.id, item])),
    [selectedItems],
  );
  const categoryById = useMemo(
    () => new Map(selectedItems.map((item) => [item.id, item.category])),
    [selectedItems],
  );
  const palette = stickerCanvasTheme(theme);
  const selectedCanvasItem = canvasItems.find(
    (item) => item.wardrobeItemId === selectedId,
  );
  const selectedWardrobeItem = wardrobeMap.get(selectedId);
  const allReady =
    selectedItems.length > 0 && selectedItems.every((item) => item.cutoutUrl);

  useEffect(() => {
    const ids = selectedItems.map((item) => item.id);
    if (ids.length === 0 && loadedStorageKey.current !== storageKey) return;

    if (loadedStorageKey.current !== storageKey) {
      let stored: ReturnType<typeof parseStoredStickerCanvas> = {
        items: [],
        theme: null,
      };
      try {
        stored = parseStoredStickerCanvas(
          JSON.parse(localStorage.getItem(storageKey) ?? "null"),
          new Set(ids),
        );
      } catch {
        localStorage.removeItem(storageKey);
      }
      setCanvasItems(
        reconcileStickerCanvasItems(stored.items, ids, categoryById),
      );
      if (stored.theme) setTheme(stored.theme);
      loadedStorageKey.current = storageKey;
      setSelectedId(ids[0] ?? "");
      return;
    }

    setCanvasItems((current) =>
      reconcileStickerCanvasItems(current, ids, categoryById),
    );
    setSelectedId((current) =>
      ids.includes(current) ? current : (ids[0] ?? ""),
    );
  }, [categoryById, selectedItems, storageKey]);

  useEffect(() => {
    if (loadedStorageKey.current !== storageKey) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ version: 1, items: canvasItems, theme }),
    );
  }, [canvasItems, storageKey, theme]);

  function updateItem(
    id: string,
    update: (item: StickerCanvasItem) => StickerCanvasItem,
  ) {
    setCanvasItems((current) =>
      current.map((item) => (item.wardrobeItemId === id ? update(item) : item)),
    );
  }

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    item: StickerCanvasItem,
  ) {
    if (!canvasRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.wardrobeItemId);
    dragState.current = {
      id: item.wardrobeItemId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragState.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const element = itemElements.current.get(drag.id);
    const item = canvasItems.find((entry) => entry.wardrobeItemId === drag.id);
    if (!element || !item) return;
    const rect = canvas.getBoundingClientRect();
    const nextX = clampNumber(
      drag.startX + (event.clientX - drag.startClientX) / rect.width,
      STICKER_CANVAS_LIMITS.x.min,
      STICKER_CANVAS_LIMITS.x.max,
    );
    const nextY = clampNumber(
      drag.startY + (event.clientY - drag.startClientY) / rect.height,
      STICKER_CANVAS_LIMITS.y.min,
      STICKER_CANVAS_LIMITS.y.max,
    );
    element.style.transform = transformStyle(
      item,
      (nextX - item.x) * rect.width,
      (nextY - item.y) * rect.height,
    );
    element.dataset.dragX = String(nextX);
    element.dataset.dragY = String(nextY);
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const element = itemElements.current.get(drag.id);
    const x = Number(element?.dataset.dragX);
    const y = Number(element?.dataset.dragY);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      if (element) {
        element.style.left = `${x * 100}%`;
        element.style.top = `${y * 100}%`;
      }
      updateItem(drag.id, (item) => ({ ...item, x, y }));
    }
    if (element) {
      const item = canvasItems.find(
        (entry) => entry.wardrobeItemId === drag.id,
      );
      element.style.transform = item ? transformStyle(item) : "";
      delete element.dataset.dragX;
      delete element.dataset.dragY;
    }
    dragState.current = null;
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    item: StickerCanvasItem,
  ) {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const distance = event.shiftKey ? 0.03 : 0.012;
    updateItem(item.wardrobeItemId, (current) => ({
      ...current,
      x: clampNumber(
        current.x +
          (event.key === "ArrowLeft"
            ? -distance
            : event.key === "ArrowRight"
              ? distance
              : 0),
        STICKER_CANVAS_LIMITS.x.min,
        STICKER_CANVAS_LIMITS.x.max,
      ),
      y: clampNumber(
        current.y +
          (event.key === "ArrowUp"
            ? -distance
            : event.key === "ArrowDown"
              ? distance
              : 0),
        STICKER_CANVAS_LIMITS.y.min,
        STICKER_CANVAS_LIMITS.y.max,
      ),
    }));
  }

  function nudge(direction: "left" | "right" | "up" | "down") {
    if (!selectedCanvasItem) return;
    updateItem(selectedCanvasItem.wardrobeItemId, (item) => ({
      ...item,
      x: clampNumber(
        item.x +
          (direction === "left" ? -0.025 : direction === "right" ? 0.025 : 0),
        STICKER_CANVAS_LIMITS.x.min,
        STICKER_CANVAS_LIMITS.x.max,
      ),
      y: clampNumber(
        item.y +
          (direction === "up" ? -0.025 : direction === "down" ? 0.025 : 0),
        STICKER_CANVAS_LIMITS.y.min,
        STICKER_CANVAS_LIMITS.y.max,
      ),
    }));
  }

  function moveLayer(direction: "front" | "back") {
    if (!selectedCanvasItem) return;
    const without = [...canvasItems]
      .sort((left, right) => left.zIndex - right.zIndex)
      .filter((item) => item.wardrobeItemId !== selectedId);
    if (direction === "front") without.push(selectedCanvasItem);
    else without.unshift(selectedCanvasItem);
    setCanvasItems(normalizeStickerStack(without));
  }

  function resetLayout() {
    setCanvasItems(
      createInitialStickerCanvasItems(
        selectedItems.map((item) => item.id),
        categoryById,
      ),
    );
    setNotice({ tone: "info", text: "已经恢复自然排布。" });
  }

  async function createBlob() {
    if (!allReady) throw new Error("stickers_not_ready");
    return exportStickerBoard({
      theme,
      items: canvasItems.flatMap((item) => {
        const wardrobeItem = wardrobeMap.get(item.wardrobeItemId);
        return wardrobeItem?.cutoutUrl
          ? [
              {
                ...item,
                imageUrl: wardrobeItem.cutoutUrl,
                name: wardrobeItem.name,
              },
            ]
          : [];
      }),
    });
  }

  async function handleDownload() {
    if (exporting || !allReady) return;
    setExporting("download");
    setNotice({ tone: "info", text: "正在生成高清图片…" });
    try {
      const blob = await createBlob();
      downloadBlob(blob, stickerBoardFilename(day));
      setNotice({ tone: "success", text: "高清贴纸图片已下载。" });
    } catch {
      setNotice({ tone: "error", text: "图片暂时无法生成，请稍后重试。" });
    } finally {
      setExporting(null);
    }
  }

  async function handleShare() {
    if (exporting || !allReady) return;
    setExporting("share");
    setNotice({ tone: "info", text: "正在准备分享图片…" });
    try {
      const blob = await createBlob();
      const filename = stickerBoardFilename(day);
      const file = new File([blob], filename, { type: "image/png" });
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: "今日贴纸" });
        setNotice({ tone: "success", text: "分享图片已经准备好。" });
      } else {
        downloadBlob(blob, filename);
        setNotice({
          tone: "success",
          text: "当前设备不支持直接分享，已改为下载。",
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setNotice(null);
      } else {
        setNotice({ tone: "error", text: "分享图片暂时无法生成。" });
      }
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <fieldset className="mt-5">
        <legend className="sr-only">画板底色</legend>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            画板底色
          </p>
          <div className="flex gap-2">
            {STICKER_CANVAS_THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={theme === option.value}
                aria-label={`选择${option.label}底色`}
                className="outfit-color-chip relative size-11 rounded-full border-2 border-white shadow-[0_5px_16px_rgba(32,33,36,0.1)]"
                style={{ backgroundColor: option.color }}
              >
                {theme === option.value ? (
                  <Check
                    className="absolute inset-0 m-auto size-4"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <div
        ref={canvasRef}
        className="sticker-free-canvas relative mt-4 aspect-[4/5] overflow-hidden rounded-[2rem]"
        style={
          {
            "--sticker-canvas-bg": palette.color,
            "--sticker-canvas-ink": palette.text,
          } as CSSProperties
        }
      >
        <div className="pointer-events-none absolute left-5 top-5 z-30">
          <p className="font-heading text-lg font-bold tracking-[-0.025em] text-[var(--sticker-canvas-ink)]">
            今日贴纸
          </p>
          <p className="mt-0.5 text-[0.58rem] font-semibold tracking-[0.12em] text-[color-mix(in_srgb,var(--sticker-canvas-ink)_52%,transparent)]">
            ENSEMBLE
          </p>
        </div>

        {canvasItems.length > 0 ? (
          [...canvasItems]
            .sort((left, right) => left.zIndex - right.zIndex)
            .map((item) => {
              const wardrobeItem = wardrobeMap.get(item.wardrobeItemId);
              if (!wardrobeItem) return null;
              const isSelected = selectedId === item.wardrobeItemId;
              return (
                <button
                  key={item.wardrobeItemId}
                  ref={(element) => {
                    if (element)
                      itemElements.current.set(item.wardrobeItemId, element);
                    else itemElements.current.delete(item.wardrobeItemId);
                  }}
                  type="button"
                  aria-label={`${wardrobeItem.name}，可拖动；方向键可微调`}
                  aria-pressed={isSelected}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                  onKeyDown={(event) => handleKeyDown(event, item)}
                  onClick={() => setSelectedId(item.wardrobeItemId)}
                  className="sticker-free-canvas-item absolute flex aspect-square touch-none items-center justify-center rounded-[1rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#27222d]"
                  data-selected={isSelected ? "true" : "false"}
                  data-ready={wardrobeItem.cutoutUrl ? "true" : "false"}
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    width: `${29 * item.scale}%`,
                    zIndex: item.zIndex,
                    transform: transformStyle(item),
                  }}
                >
                  {wardrobeItem.cutoutUrl || wardrobeItem.imageUrl ? (
                    <GarmentSticker
                      imageUrl={wardrobeItem.imageUrl}
                      cutoutUrl={wardrobeItem.cutoutUrl}
                      alt=""
                      sizes="160px"
                      surface={wardrobeItem.cutoutUrl ? "loose" : "card"}
                      className="pointer-events-none size-full rounded-[1rem]"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center rounded-[1rem] bg-white/55 text-[var(--text-tertiary)]">
                      <ImageOff className="size-5" aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-[var(--sticker-canvas-ink)]">
            <ImageOff className="size-6 opacity-45" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">先从下方选择衣物</p>
          </div>
        )}
      </div>

      {selectedCanvasItem && selectedWardrobeItem ? (
        <section
          className="surface-card mt-4 rounded-[1.55rem] p-4"
          aria-label="贴纸调整工具"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {selectedWardrobeItem.name}
              </p>
              <p className="mt-1 text-[0.66rem] text-[var(--text-tertiary)]">
                拖动贴纸，控件精细调整
              </p>
            </div>
            <button
              type="button"
              onClick={resetLayout}
              className="motion-button flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface-soft)] px-3 text-xs font-semibold"
            >
              <Redo2 className="size-3.5" aria-hidden="true" />
              重排
            </button>
          </div>

          <label className="mt-4 grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 text-xs font-semibold">
            <span>大小</span>
            <input
              type="range"
              min={STICKER_CANVAS_LIMITS.scale.min}
              max={STICKER_CANVAS_LIMITS.scale.max}
              step="0.05"
              value={selectedCanvasItem.scale}
              onChange={(event) =>
                updateItem(selectedId, (item) => ({
                  ...item,
                  scale: Number(event.target.value),
                }))
              }
              className="sticker-tool-range"
            />
            <span className="text-right text-[0.65rem] text-[var(--text-tertiary)]">
              {Math.round(selectedCanvasItem.scale * 100)}%
            </span>
          </label>
          <label className="mt-3 grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 text-xs font-semibold">
            <span>旋转</span>
            <input
              type="range"
              min={STICKER_CANVAS_LIMITS.rotation.min}
              max={STICKER_CANVAS_LIMITS.rotation.max}
              step="5"
              value={selectedCanvasItem.rotation}
              onChange={(event) =>
                updateItem(selectedId, (item) => ({
                  ...item,
                  rotation: Number(event.target.value),
                }))
              }
              className="sticker-tool-range"
            />
            <span className="text-right text-[0.65rem] text-[var(--text-tertiary)]">
              {selectedCanvasItem.rotation}°
            </span>
          </label>

          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
            <CanvasTool
              label="左移"
              icon={ArrowLeft}
              onClick={() => nudge("left")}
            />
            <CanvasTool
              label="右移"
              icon={ArrowRight}
              onClick={() => nudge("right")}
            />
            <CanvasTool
              label="上移"
              icon={ArrowUp}
              onClick={() => nudge("up")}
            />
            <CanvasTool
              label="下移"
              icon={ArrowDown}
              onClick={() => nudge("down")}
            />
            <CanvasTool
              label="置底"
              icon={ArrowDownToLine}
              onClick={() => moveLayer("back")}
            />
            <CanvasTool
              label="置顶"
              icon={ArrowUpToLine}
              onClick={() => moveLayer("front")}
            />
            <CanvasTool
              label="移除"
              icon={Trash2}
              onClick={() => onRemove(selectedId)}
              tone="danger"
            />
          </div>
        </section>
      ) : null}

      {!allReady && selectedItems.length > 0 ? (
        <p className="mt-3 rounded-[1rem] bg-[var(--fashion-lilac-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
          先完成待生成贴纸，再下载或分享高清成品。
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!allReady || Boolean(exporting)}
          className="motion-button flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--surface-solid)] text-sm font-semibold shadow-[0_10px_28px_rgba(64,48,75,0.1)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {exporting === "download" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          下载
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!allReady || Boolean(exporting)}
          className="motion-button flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {exporting === "share" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Share2 className="size-4" aria-hidden="true" />
          )}
          分享
        </button>
      </div>

      {notice ? (
        <output
          className={`motion-status mt-3 block rounded-[1rem] px-4 py-3 text-xs leading-5 ${notice.tone === "error" ? "bg-[#fff0ed] text-[#9c2f1f]" : notice.tone === "success" ? "bg-[#eef8e4] text-[#325821]" : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"}`}
        >
          {notice.text}
        </output>
      ) : null}
    </>
  );
}

function CanvasTool({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: typeof ArrowLeft;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`motion-button flex min-h-12 flex-col items-center justify-center gap-1 rounded-[0.9rem] text-[0.62rem] font-semibold ${tone === "danger" ? "bg-[#fff0ed] text-[#a13b2c]" : "bg-[var(--surface-soft)]"}`}
    >
      <Icon className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
      {label}
    </button>
  );
}
