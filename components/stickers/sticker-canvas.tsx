"use client";

import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  Check,
  Crop,
  Download,
  Eraser,
  ImageOff,
  LoaderCircle,
  Maximize2,
  Redo2,
  RotateCcw,
  RotateCw,
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
import { StickerEraser } from "@/components/stickers/sticker-eraser";
import { cropFromPointerDelta } from "@/lib/stickers/crop-gesture";
import {
  StickerOutlineControls,
  useStickerOutlineColor,
} from "@/components/stickers/outline-controls";
import {
  STICKER_CANVAS_LIMITS,
  STICKER_CANVAS_THEMES,
  EMPTY_STICKER_CROP,
  clampNumber,
  clampStickerCrop,
  createInitialStickerCanvasItems,
  moveStickerLayer,
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

type TransformState = {
  id: string;
  pointerId: number;
  kind: "scale" | "rotate";
  startDistance: number;
  startAngle: number;
  startScale: number;
  startRotation: number;
  moved: boolean;
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
  onRefined,
  storageKey,
}: {
  day: string;
  items: StickerCanvasWardrobeItem[];
  onRemove: (id: string) => void;
  onRefined?: (id: string, url: string) => void;
  storageKey: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const outlineColor = useStickerOutlineColor();
  const itemElements = useRef(new Map<string, HTMLDivElement>());
  const dragState = useRef<DragState | null>(null);
  const transformState = useRef<TransformState | null>(null);
  const ignoreNextHandleClick = useRef(false);
  const loadedStorageKey = useRef<string | null>(null);
  const [canvasItems, setCanvasItems] = useState<StickerCanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [theme, setTheme] = useState<StickerCanvasTheme>("lilac");
  const [cropOpen, setCropOpen] = useState(false);
  const [eraserId, setEraserId] = useState("");
  const [refinedUrls, setRefinedUrls] = useState<Record<string, string>>({});
  const cropGesture = useRef<{
    id: string;
    pointerId: number;
    edge: keyof StickerCanvasItem["crop"];
    x: number;
    y: number;
    size: number;
    rotation: number;
    crop: StickerCanvasItem["crop"];
  } | null>(null);
  const [exporting, setExporting] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const wardrobeMap = useMemo(
    () =>
      new Map(
        selectedItems.map((item) => [
          item.id,
          { ...item, cutoutUrl: refinedUrls[item.id] ?? item.cutoutUrl },
        ]),
      ),
    [selectedItems, refinedUrls],
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
  useEffect(() => {
    if (!selectedId || eraserId) return;
    const dismiss = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId("");
        setCropOpen(false);
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [selectedId, eraserId]);
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
      setSelectedId("");
      return;
    }

    setCanvasItems((current) =>
      reconcileStickerCanvasItems(current, ids, categoryById),
    );
    setSelectedId((current) =>
      !current || ids.includes(current) ? current : "",
    );
  }, [categoryById, selectedItems, storageKey]);

  useEffect(() => {
    if (loadedStorageKey.current !== storageKey) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ version: 2, items: canvasItems, theme }),
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

  function handleTransformPointerDown(
    event: PointerEvent<HTMLButtonElement>,
    item: StickerCanvasItem,
    kind: "scale" | "rotate",
  ) {
    const element = itemElements.current.get(item.wardrobeItemId);
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setSelectedId(item.wardrobeItemId);
    transformState.current = {
      id: item.wardrobeItemId,
      pointerId: event.pointerId,
      kind,
      startDistance: Math.max(
        1,
        Math.hypot(event.clientX - centerX, event.clientY - centerY),
      ),
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      startScale: item.scale,
      startRotation: item.rotation,
      moved: false,
    };
  }

  function handleTransformPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const gesture = transformState.current;
    const element = gesture ? itemElements.current.get(gesture.id) : null;
    if (!gesture || !element || gesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.max(
      1,
      Math.hypot(event.clientX - centerX, event.clientY - centerY),
    );
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    gesture.moved =
      gesture.moved || Math.abs(distance - gesture.startDistance) > 3;
    if (gesture.kind === "scale") {
      updateItem(gesture.id, (item) => ({
        ...item,
        scale: clampNumber(
          gesture.startScale * (distance / gesture.startDistance),
          STICKER_CANVAS_LIMITS.scale.min,
          STICKER_CANVAS_LIMITS.scale.max,
        ),
      }));
      return;
    }
    const delta = ((angle - gesture.startAngle) * 180) / Math.PI;
    gesture.moved = gesture.moved || Math.abs(delta) > 2;
    updateItem(gesture.id, (item) => ({
      ...item,
      rotation: clampNumber(
        gesture.startRotation + delta,
        STICKER_CANVAS_LIMITS.rotation.min,
        STICKER_CANVAS_LIMITS.rotation.max,
      ),
    }));
  }

  function finishTransform(event: PointerEvent<HTMLButtonElement>) {
    const gesture = transformState.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    ignoreNextHandleClick.current = gesture.moved;
    transformState.current = null;
  }

  function handleCornerClick(
    id: string,
    kind: "grow" | "shrink" | "clockwise" | "counterclockwise",
  ) {
    if (ignoreNextHandleClick.current) {
      ignoreNextHandleClick.current = false;
      return;
    }
    updateItem(id, (item) => ({
      ...item,
      scale:
        kind === "grow" || kind === "shrink"
          ? clampNumber(
              item.scale + (kind === "grow" ? 0.1 : -0.1),
              STICKER_CANVAS_LIMITS.scale.min,
              STICKER_CANVAS_LIMITS.scale.max,
            )
          : item.scale,
      rotation:
        kind === "clockwise" || kind === "counterclockwise"
          ? clampNumber(
              item.rotation + (kind === "clockwise" ? 15 : -15),
              STICKER_CANVAS_LIMITS.rotation.min,
              STICKER_CANVAS_LIMITS.rotation.max,
            )
          : item.rotation,
    }));
  }

  function updateCrop(edge: keyof StickerCanvasItem["crop"], value: number) {
    if (!selectedId) return;
    updateItem(selectedId, (item) => ({
      ...item,
      crop: clampStickerCrop({ ...item.crop, [edge]: value }),
    }));
  }

  function startCrop(
    event: PointerEvent<HTMLButtonElement>,
    edge: keyof StickerCanvasItem["crop"],
  ) {
    if (
      !selectedCanvasItem ||
      !event.isPrimary ||
      event.button !== 0 ||
      cropGesture.current
    )
      return;
    const element = itemElements.current.get(selectedId);
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    cropGesture.current = {
      id: selectedId,
      pointerId: event.pointerId,
      edge,
      x: event.clientX,
      y: event.clientY,
      size: element.offsetWidth,
      rotation: selectedCanvasItem.rotation,
      crop: { ...selectedCanvasItem.crop },
    };
  }
  function moveCrop(event: PointerEvent<HTMLButtonElement>) {
    const gesture = cropGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const crop = cropFromPointerDelta(
      gesture.crop,
      gesture.edge,
      event.clientX - gesture.x,
      event.clientY - gesture.y,
      gesture.rotation,
      gesture.size,
    );
    updateItem(gesture.id, (item) => ({ ...item, crop }));
  }
  function finishCrop(event: PointerEvent<HTMLButtonElement>, cancel = false) {
    const gesture = cropGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (cancel)
      updateItem(gesture.id, (item) => ({ ...item, crop: gesture.crop }));
    else moveCrop(event);
    cropGesture.current = null;
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
    setCanvasItems((current) =>
      moveStickerLayer(current, selectedCanvasItem.wardrobeItemId, direction),
    );
    setNotice({
      tone: "success",
      text: direction === "front" ? "贴纸已置顶。" : "贴纸已置底。",
    });
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
      outlineColor,
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
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          画板底色
        </p>
        <div className="mt-3 space-y-2.5">
          {(
            [
              ["light", "浅色"],
              ["dark", "深色"],
            ] as const
          ).map(([tone, label]) => (
            <div
              key={tone}
              className="grid grid-cols-[2.5rem_1fr] items-center gap-3"
            >
              <span className="text-[0.68rem] font-semibold text-[var(--text-tertiary)]">
                {label}
              </span>
              <div className="flex flex-wrap gap-2">
                {STICKER_CANVAS_THEMES.filter(
                  (option) => option.tone === tone,
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={theme === option.value}
                    aria-label={`选择${label}${option.label}底色`}
                    className="outfit-color-chip relative size-11 rounded-full border-2 border-white shadow-[0_5px_16px_rgba(32,33,36,0.13)]"
                    style={{
                      background: `linear-gradient(145deg, ${option.color}, ${option.endColor})`,
                      color: option.text,
                    }}
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
          ))}
        </div>
      </fieldset>

      <StickerOutlineControls />

      <div
        ref={canvasRef}
        data-no-swipe
        className="sticker-free-canvas relative mt-4 aspect-[4/5] overflow-hidden rounded-[2rem]"
        data-tone={palette.tone}
        style={
          {
            "--sticker-canvas-bg": palette.color,
            "--sticker-canvas-end": palette.endColor,
            "--sticker-canvas-accent": palette.accentColor,
            "--sticker-canvas-ink": palette.text,
          } as CSSProperties
        }
      >
        <button
          type="button"
          aria-label="取消选择贴纸"
          onClick={() => {
            setSelectedId("");
            setCropOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setSelectedId("");
              setCropOpen(false);
            }
          }}
          className="absolute inset-0 z-0 rounded-[2rem] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--sticker-canvas-ink)]"
        />
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
              const cropInset = `${item.crop.top * 100}% ${item.crop.right * 100}% ${item.crop.bottom * 100}% ${item.crop.left * 100}%`;
              return (
                <div
                  key={item.wardrobeItemId}
                  ref={(element) => {
                    if (element)
                      itemElements.current.set(item.wardrobeItemId, element);
                    else itemElements.current.delete(item.wardrobeItemId);
                  }}
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
                  <button
                    type="button"
                    aria-label={`${wardrobeItem.name}，拖动移动；方向键可微调`}
                    aria-pressed={isSelected}
                    onPointerDown={(event) => handlePointerDown(event, item)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishDrag}
                    onPointerCancel={finishDrag}
                    onKeyDown={(event) => handleKeyDown(event, item)}
                    onClick={() => {
                      setSelectedId(item.wardrobeItemId);
                      setCropOpen(false);
                    }}
                    className="sticker-drag-surface absolute inset-0 z-10 flex touch-none items-center justify-center rounded-[1rem]"
                  >
                    <span
                      className="pointer-events-none relative block size-full overflow-hidden rounded-[1rem]"
                      style={{ clipPath: `inset(${cropInset})` }}
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
                    </span>
                  </button>
                </div>
              );
            })
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-[var(--sticker-canvas-ink)]">
            <ImageOff className="size-6 opacity-45" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">先从下方选择衣物</p>
          </div>
        )}
        {selectedCanvasItem ? (
          <div
            className="pointer-events-none absolute aspect-square"
            style={{
              left: `${selectedCanvasItem.x * 100}%`,
              top: `${selectedCanvasItem.y * 100}%`,
              width: `${29 * selectedCanvasItem.scale}%`,
              zIndex: 50,
              transform: transformStyle(selectedCanvasItem),
            }}
          >
            {cropOpen ? (
              <>
                <span
                  className="absolute border-2 border-white shadow-[0_0_0_1px_#46364f]"
                  style={{
                    inset: `${selectedCanvasItem.crop.top * 100}% ${selectedCanvasItem.crop.right * 100}% ${selectedCanvasItem.crop.bottom * 100}% ${selectedCanvasItem.crop.left * 100}%`,
                  }}
                />
                {(
                  [
                    ["top", "上边"],
                    ["right", "右边"],
                    ["bottom", "下边"],
                    ["left", "左边"],
                  ] as const
                ).map(([edge, label]) => {
                  const crop = selectedCanvasItem.crop;
                  const horizontal = edge === "top" || edge === "bottom";
                  return (
                    <button
                      key={edge}
                      type="button"
                      aria-label={`拖动裁切${label}`}
                      title={`裁切${label}；方向键微调`}
                      data-crop-edge={edge}
                      className="pointer-events-auto absolute z-20 flex size-11 touch-none items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#d9c6ef]"
                      style={{
                        left: `${(edge === "left" ? crop.left : edge === "right" ? 1 - crop.right : (crop.left + 1 - crop.right) / 2) * 100}%`,
                        top: `${(edge === "top" ? crop.top : edge === "bottom" ? 1 - crop.bottom : (crop.top + 1 - crop.bottom) / 2) * 100}%`,
                        transform:
                          edge === "top"
                            ? "translate(-50%,-100%)"
                            : edge === "bottom"
                              ? "translate(-50%,0)"
                              : edge === "left"
                                ? "translate(-100%,-50%)"
                                : "translate(0,-50%)",
                      }}
                      onPointerDown={(event) => startCrop(event, edge)}
                      onPointerMove={moveCrop}
                      onPointerUp={(event) => finishCrop(event)}
                      onPointerCancel={(event) => finishCrop(event, true)}
                      onLostPointerCapture={(event) => {
                        if (cropGesture.current) finishCrop(event, true);
                      }}
                      onKeyDown={(event) => {
                        if (
                          ![
                            "ArrowUp",
                            "ArrowDown",
                            "ArrowLeft",
                            "ArrowRight",
                            "Home",
                            "End",
                          ].includes(event.key)
                        )
                          return;
                        event.preventDefault();
                        event.stopPropagation();
                        const inward =
                          edge === "top"
                            ? "ArrowDown"
                            : edge === "bottom"
                              ? "ArrowUp"
                              : edge === "left"
                                ? "ArrowRight"
                                : "ArrowLeft";
                        updateCrop(
                          edge,
                          event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? 0.4
                              : crop[edge] +
                                (event.key === inward ? 0.02 : -0.02),
                        );
                      }}
                    >
                      <span
                        className={`rounded-full bg-white shadow-[0_0_0_1px_#46364f] ${horizontal ? "h-2 w-6" : "h-6 w-2"}`}
                      />
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                <CornerHandle
                  label="缩小贴纸"
                  position="top-left"
                  icon={Maximize2}
                  onPointerDown={(event) =>
                    handleTransformPointerDown(
                      event,
                      selectedCanvasItem,
                      "scale",
                    )
                  }
                  onPointerMove={handleTransformPointerMove}
                  onPointerUp={finishTransform}
                  onPointerCancel={finishTransform}
                  onClick={() => handleCornerClick(selectedId, "shrink")}
                />
                <CornerHandle
                  label="顺时针旋转贴纸"
                  position="top-right"
                  icon={RotateCw}
                  onPointerDown={(event) =>
                    handleTransformPointerDown(
                      event,
                      selectedCanvasItem,
                      "rotate",
                    )
                  }
                  onPointerMove={handleTransformPointerMove}
                  onPointerUp={finishTransform}
                  onPointerCancel={finishTransform}
                  onClick={() => handleCornerClick(selectedId, "clockwise")}
                />
                <CornerHandle
                  label="逆时针旋转贴纸"
                  position="bottom-left"
                  icon={RotateCcw}
                  onPointerDown={(event) =>
                    handleTransformPointerDown(
                      event,
                      selectedCanvasItem,
                      "rotate",
                    )
                  }
                  onPointerMove={handleTransformPointerMove}
                  onPointerUp={finishTransform}
                  onPointerCancel={finishTransform}
                  onClick={() =>
                    handleCornerClick(selectedId, "counterclockwise")
                  }
                />
                <CornerHandle
                  label="放大贴纸"
                  position="bottom-right"
                  icon={Maximize2}
                  onPointerDown={(event) =>
                    handleTransformPointerDown(
                      event,
                      selectedCanvasItem,
                      "scale",
                    )
                  }
                  onPointerMove={handleTransformPointerMove}
                  onPointerUp={finishTransform}
                  onPointerCancel={finishTransform}
                  onClick={() => handleCornerClick(selectedId, "grow")}
                />
              </>
            )}
          </div>
        ) : null}
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
                {cropOpen
                  ? "拖动四边裁切 · 可随时恢复完整"
                  : "中间移动 · 四角缩放与旋转"}
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

          {selectedWardrobeItem.cutoutUrl ? (
            <button
              type="button"
              onClick={() => {
                setCropOpen(false);
                setEraserId(selectedId);
              }}
              className="motion-button mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--fashion-lilac-soft)] text-sm font-semibold"
            >
              <Eraser className="size-4" aria-hidden="true" />
              橡皮擦
            </button>
          ) : null}

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
              label={cropOpen ? "收起裁切" : "裁切"}
              icon={Crop}
              onClick={() => setCropOpen((current) => !current)}
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

          {cropOpen ? (
            <div className="sticker-crop-panel mt-4 rounded-[1.2rem] bg-[var(--surface-soft)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold">四边裁切</p>
                <button
                  type="button"
                  onClick={() =>
                    updateItem(selectedId, (item) => ({
                      ...item,
                      crop: { ...EMPTY_STICKER_CROP },
                    }))
                  }
                  className="motion-button min-h-10 rounded-full bg-white/70 px-3 text-xs font-semibold"
                >
                  恢复完整
                </button>
              </div>
              <details className="mt-3">
                <summary className="min-h-11 cursor-pointer text-xs font-semibold leading-[44px]">
                  精确调整
                </summary>
                <div className="grid gap-3">
                  {(
                    [
                      ["top", "上边"],
                      ["right", "右边"],
                      ["bottom", "下边"],
                      ["left", "左边"],
                    ] as const
                  ).map(([edge, label]) => (
                    <label
                      key={edge}
                      className="grid grid-cols-[2.5rem_1fr_2.4rem] items-center gap-2 text-xs font-semibold"
                    >
                      <span>{label}</span>
                      <input
                        type="range"
                        min="0"
                        max="0.4"
                        step="0.02"
                        value={selectedCanvasItem.crop[edge]}
                        onChange={(event) =>
                          updateCrop(edge, Number(event.target.value))
                        }
                        className="sticker-tool-range"
                      />
                      <span className="text-right text-[0.62rem] text-[var(--text-tertiary)]">
                        {Math.round(selectedCanvasItem.crop[edge] * 100)}%
                      </span>
                    </label>
                  ))}
                </div>
              </details>
              <button
                type="button"
                onClick={() => setCropOpen(false)}
                className="motion-button mt-4 min-h-11 w-full rounded-full bg-[#1d1d1f] text-xs font-semibold text-white"
              >
                完成裁切
              </button>
            </div>
          ) : null}
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
      {eraserId && wardrobeMap.get(eraserId) ? (
        <StickerEraser
          key={eraserId}
          itemId={eraserId}
          name={wardrobeMap.get(eraserId)?.name ?? "衣物贴纸"}
          onCancel={() => setEraserId("")}
          onSaved={(url) => {
            setRefinedUrls((current) => ({ ...current, [eraserId]: url }));
            onRefined?.(eraserId, url);
            setEraserId("");
            setNotice({
              tone: "success",
              text: "贴纸已保存，原照片保持不变。",
            });
          }}
        />
      ) : null}
    </>
  );
}

function CornerHandle({
  icon: Icon,
  label,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  position,
}: {
  icon: typeof Maximize2;
  label: string;
  onClick: () => void;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-position={position}
      onClick={onClick}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="sticker-corner-handle absolute z-20 flex size-11 touch-none items-center justify-center rounded-full bg-white text-[#33283e] shadow-[0_6px_18px_rgba(45,32,58,0.22)]"
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
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
