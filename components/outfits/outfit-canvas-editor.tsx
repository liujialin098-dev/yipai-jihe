"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpToLine,
  Check,
  Eraser,
  LoaderCircle,
  Minus,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { saveOutfitCanvas, saveWardrobeCutout } from "@/app/outfits/actions";
import { CutoutRefiner } from "@/components/outfits/cutout-refiner";
import {
  CANVAS_ITEM_LIMITS,
  OUTFIT_CANVAS_THEMES,
  clampNumber,
  createInitialCanvasItems,
  normalizeCanvasStack,
  outfitCanvasTheme,
  type OutfitCanvasItem,
  type OutfitCanvasTheme,
} from "@/lib/outfits/canvas";
import { removeConnectedPlainBackground } from "@/lib/outfits/cutout";
import type { OutfitCanvasEditorData } from "@/lib/outfits/data";
import { exportOutfitCard, outfitCardFilename } from "@/lib/outfits/export";
import { createClient } from "@/lib/supabase/client";

type Message = { tone: "error" | "success" | "info"; text: string } | null;

type DragState = {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

function transformStyle(item: OutfitCanvasItem, dx = 0, dy = 0) {
  return `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${item.rotation}deg)`;
}

function imageToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("png_failed"))),
      "image/png",
      1,
    );
  });
}

export function OutfitCanvasEditor({
  initialData,
}: {
  initialData: OutfitCanvasEditorData;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemElements = useRef(new Map<string, HTMLButtonElement>());
  const dragState = useRef<DragState | null>(null);
  const [items, setItems] = useState(initialData.items);
  const [title, setTitle] = useState(initialData.title);
  const [theme, setTheme] = useState<OutfitCanvasTheme>(
    initialData.backgroundTheme,
  );
  const [canvasId, setCanvasId] = useState(initialData.canvasId);
  const [selectedId, setSelectedId] = useState(
    initialData.items[0]?.wardrobeItemId ?? "",
  );
  const [cutoutUrls, setCutoutUrls] = useState<Record<string, string>>(
    Object.fromEntries(
      initialData.wardrobeItems.flatMap((item) =>
        item.cutoutUrl ? [[item.id, item.cutoutUrl]] : [],
      ),
    ),
  );
  const [cutoutPendingId, setCutoutPendingId] = useState<string | null>(null);
  const [refineItemId, setRefineItemId] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [saving, startSaving] = useTransition();

  const wardrobeMap = useMemo(
    () => new Map(initialData.wardrobeItems.map((item) => [item.id, item])),
    [initialData.wardrobeItems],
  );
  const palette = outfitCanvasTheme(theme);
  const selectedItem = items.find((item) => item.wardrobeItemId === selectedId);
  const selectedWardrobeItem = selectedId
    ? wardrobeMap.get(selectedId)
    : undefined;

  function updateItem(
    id: string,
    update: (item: OutfitCanvasItem) => OutfitCanvasItem,
  ) {
    setItems((current) =>
      current.map((item) => (item.wardrobeItemId === id ? update(item) : item)),
    );
  }

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    item: OutfitCanvasItem,
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
    const item = items.find((entry) => entry.wardrobeItemId === drag.id);
    if (!element || !item) return;
    const rect = canvas.getBoundingClientRect();
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    const nextX = clampNumber(
      drag.startX + dx / rect.width,
      CANVAS_ITEM_LIMITS.x.min,
      CANVAS_ITEM_LIMITS.x.max,
    );
    const nextY = clampNumber(
      drag.startY + dy / rect.height,
      CANVAS_ITEM_LIMITS.y.min,
      CANVAS_ITEM_LIMITS.y.max,
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
      updateItem(drag.id, (item) => ({ ...item, x, y }));
    }
    if (element) {
      element.style.transform = "";
      delete element.dataset.dragX;
      delete element.dataset.dragY;
    }
    dragState.current = null;
  }

  function handleItemKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    item: OutfitCanvasItem,
  ) {
    const delta = event.shiftKey ? 0.03 : 0.012;
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    updateItem(item.wardrobeItemId, (current) => ({
      ...current,
      x: clampNumber(
        current.x +
          (event.key === "ArrowLeft"
            ? -delta
            : event.key === "ArrowRight"
              ? delta
              : 0),
        CANVAS_ITEM_LIMITS.x.min,
        CANVAS_ITEM_LIMITS.x.max,
      ),
      y: clampNumber(
        current.y +
          (event.key === "ArrowUp"
            ? -delta
            : event.key === "ArrowDown"
              ? delta
              : 0),
        CANVAS_ITEM_LIMITS.y.min,
        CANVAS_ITEM_LIMITS.y.max,
      ),
    }));
  }

  function adjustSelected(
    kind: "scale-up" | "scale-down" | "rotate-left" | "rotate-right",
  ) {
    if (!selectedItem) return;
    updateItem(selectedItem.wardrobeItemId, (item) => ({
      ...item,
      scale:
        kind === "scale-up" || kind === "scale-down"
          ? clampNumber(
              item.scale + (kind === "scale-up" ? 0.1 : -0.1),
              CANVAS_ITEM_LIMITS.scale.min,
              CANVAS_ITEM_LIMITS.scale.max,
            )
          : item.scale,
      rotation:
        kind === "rotate-left" || kind === "rotate-right"
          ? clampNumber(
              item.rotation + (kind === "rotate-right" ? 5 : -5),
              CANVAS_ITEM_LIMITS.rotation.min,
              CANVAS_ITEM_LIMITS.rotation.max,
            )
          : item.rotation,
    }));
  }

  function moveLayer(direction: "front" | "back") {
    if (!selectedItem) return;
    const ordered = [...items].sort((a, b) => a.zIndex - b.zIndex);
    const without = ordered.filter(
      (item) => item.wardrobeItemId !== selectedId,
    );
    if (direction === "front") without.push(selectedItem);
    else without.unshift(selectedItem);
    setItems(normalizeCanvasStack(without));
  }

  function removeSelected() {
    if (!selectedItem || items.length <= 2) return;
    const next = normalizeCanvasStack(
      items.filter(
        (item) => item.wardrobeItemId !== selectedItem.wardrobeItemId,
      ),
    );
    setItems(next);
    setSelectedId(next[0]?.wardrobeItemId ?? "");
  }

  async function createLocalCutout() {
    if (!selectedWardrobeItem?.imageUrl || cutoutPendingId) return;
    setCutoutPendingId(selectedWardrobeItem.id);
    setMessage({ tone: "info", text: "正在本机整理背景，原图不会被覆盖。" });
    try {
      const response = await fetch(selectedWardrobeItem.imageUrl, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("image_fetch_failed");
      const bitmap = await createImageBitmap(await response.blob());
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("canvas_unavailable");
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const source = context.getImageData(0, 0, width, height);
      const result = removeConnectedPlainBackground(source);
      if (result.status === "unsupported-background") {
        setMessage({
          tone: "error",
          text: "这张图的背景较复杂，已保留原图。纯色背景照片会更容易抠干净。",
        });
        return;
      }
      const output = context.createImageData(
        result.image.width,
        result.image.height,
      );
      output.data.set(result.image.data);
      context.putImageData(output, 0, 0);
      const png = await imageToPngBlob(canvas);
      const supabase = createClient();
      const userResult = await supabase.auth.getUser();
      const user = userResult.data.user;
      if (!user) throw new Error("unauthorized");
      const path = `${user.id}/cutouts/${selectedWardrobeItem.id}.png`;
      const uploadResult = await supabase.storage
        .from("wardrobe-images")
        .upload(path, png, {
          cacheControl: "31536000",
          contentType: "image/png",
          upsert: true,
        });
      if (uploadResult.error) throw uploadResult.error;
      const saveResult = await saveWardrobeCutout(
        selectedWardrobeItem.id,
        path,
      );
      if (saveResult.status === "error") throw new Error(saveResult.message);
      setCutoutUrls((current) => ({
        ...current,
        [selectedWardrobeItem.id]: saveResult.cutoutUrl,
      }));
      setMessage({ tone: "success", text: saveResult.message });
    } catch {
      setMessage({ tone: "error", text: "本地抠图暂时失败，已继续使用原图。" });
    } finally {
      setCutoutPendingId(null);
    }
  }

  async function createProfessionalCutout() {
    if (!selectedWardrobeItem?.imageUrl || cutoutPendingId) return;
    const force = Boolean(cutoutUrls[selectedWardrobeItem.id]);
    setCutoutPendingId(selectedWardrobeItem.id);
    setMessage({
      tone: "info",
      text: force
        ? "正在重新优化边缘，旧透明图会保留到新结果成功。"
        : "正在进行专业抠图，原图会继续保留。",
    });
    try {
      const response = await fetch(
        `/api/wardrobe/items/${selectedWardrobeItem.id}/cutout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        cutoutUrl?: string;
        message?: string;
        error?: { message?: string };
      } | null;
      if (!response.ok || !payload?.cutoutUrl) {
        throw new Error(
          payload?.error?.message ?? "专业抠图暂时不可用，已保留当前图片。",
        );
      }
      setCutoutUrls((current) => ({
        ...current,
        [selectedWardrobeItem.id]: payload.cutoutUrl as string,
      }));
      setMessage({
        tone: "success",
        text: payload.message ?? "专业抠图已完成。",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "专业抠图暂时不可用，已保留当前图片。",
      });
    } finally {
      setCutoutPendingId(null);
    }
  }

  async function saveRefinement(blob: Blob) {
    const wardrobeItem = refineItemId
      ? wardrobeMap.get(refineItemId)
      : undefined;
    if (!wardrobeItem) throw new Error("item_missing");
    const response = await fetch(
      `/api/wardrobe/items/${wardrobeItem.id}/cutout/source`,
      {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: blob,
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      cutoutUrl?: string;
      message?: string;
      error?: { message?: string };
    } | null;
    if (!response.ok || !payload?.cutoutUrl) {
      throw new Error(payload?.error?.message ?? "精修结果暂时无法保存。");
    }
    setCutoutUrls((current) => ({
      ...current,
      [wardrobeItem.id]: payload.cutoutUrl as string,
    }));
    setRefineItemId(null);
    setMessage({
      tone: "success",
      text: payload.message ?? "边缘精修已保存。",
    });
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveOutfitCanvas({
        ...(canvasId ? { canvasId } : {}),
        ...(initialData.sourceRecommendationId
          ? { sourceRecommendationId: initialData.sourceRecommendationId }
          : {}),
        ...(initialData.sourceSlot
          ? { sourceSlot: initialData.sourceSlot }
          : {}),
        title,
        backgroundTheme: theme,
        items,
      });
      if (result.status !== "success") {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setCanvasId(result.canvasId);
      setMessage({ tone: "success", text: result.message });
      if (!initialData.canvasId) router.replace(`/outfits/${result.canvasId}`);
      else router.refresh();
    });
  }

  async function handleExport() {
    if (exportPending) return;
    setExportPending(true);
    setMessage({ tone: "info", text: "正在生成分享图片。" });
    try {
      const blob = await exportOutfitCard({
        title: title.trim() || "我的穿搭",
        theme,
        items: items.flatMap((item) => {
          const wardrobeItem = wardrobeMap.get(item.wardrobeItemId);
          const imageUrl =
            cutoutUrls[item.wardrobeItemId] ?? wardrobeItem?.imageUrl;
          return wardrobeItem && imageUrl
            ? [{ ...item, imageUrl, name: wardrobeItem.name }]
            : [];
        }),
      });
      const filename = outfitCardFilename(title);
      const file = new File([blob], filename, { type: "image/png" });
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: title.trim() || "我的穿搭",
        });
        setMessage({ tone: "success", text: "分享图片已准备好。" });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ tone: "success", text: "分享图片已下载。" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage(null);
      } else {
        setMessage({
          tone: "error",
          text: "图片暂时无法导出，请检查衣物图片后重试。",
        });
      }
    } finally {
      setExportPending(false);
    }
  }

  return (
    <div className="page-enter px-4 pt-3">
      <header className="px-1">
        <p className="app-page-meta">穿搭画布</p>
        <h1 className="app-page-title mt-1">把衣服摆成你的样子</h1>
        <p className="app-page-lead mt-3">
          拖动真实衣物，调整大小和层次。没有模特，也不会重新画衣服。
        </p>
      </header>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            卡片名称
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 30))}
            className="field-control h-12 bg-white/80 px-4 text-sm"
            maxLength={30}
            aria-describedby="outfit-title-count"
          />
          <span
            id="outfit-title-count"
            className="text-right text-[0.65rem] text-[var(--text-tertiary)]"
          >
            {title.length}/30
          </span>
        </label>

        <fieldset>
          <legend className="text-xs font-semibold text-[var(--text-secondary)]">
            卡片底色
          </legend>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {OUTFIT_CANVAS_THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={theme === option.value}
                aria-label={`选择${option.label}底色`}
                className="outfit-color-chip relative size-11 shrink-0 rounded-full border-2 border-white shadow-[0_5px_16px_rgba(32,33,36,0.12)]"
                style={{ backgroundColor: option.color }}
              >
                {theme === option.value ? (
                  <Check
                    className="absolute inset-0 m-auto size-4 text-[#202124]"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div
        ref={canvasRef}
        className="outfit-canvas outfit-canvas-editor relative mt-4 aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_22px_70px_rgba(70,72,78,0.16)]"
        style={
          {
            "--canvas-bg": palette.color,
            "--canvas-ink": palette.text,
          } as CSSProperties
        }
      >
        <div className="pointer-events-none absolute top-5 left-5 z-20 max-w-[72%]">
          <p className="font-heading text-[1.3rem] leading-tight font-semibold tracking-[-0.025em] text-[var(--canvas-ink)]">
            {title.trim() || "我的穿搭"}
          </p>
          <p className="mt-1 text-[0.64rem] font-semibold text-[color-mix(in_srgb,var(--canvas-ink)_62%,transparent)]">
            衣拍即合
          </p>
        </div>

        {[...items]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((item) => {
            const wardrobeItem = wardrobeMap.get(item.wardrobeItemId);
            if (!wardrobeItem) return null;
            const cutoutUrl = cutoutUrls[item.wardrobeItemId];
            const imageUrl = cutoutUrl ?? wardrobeItem.imageUrl;
            const selected = selectedId === item.wardrobeItemId;
            return (
              <button
                key={item.wardrobeItemId}
                ref={(element) => {
                  if (element)
                    itemElements.current.set(item.wardrobeItemId, element);
                  else itemElements.current.delete(item.wardrobeItemId);
                }}
                type="button"
                aria-label={`${wardrobeItem.name}，可拖动，方向键微调位置`}
                aria-pressed={selected}
                onPointerDown={(event) => handlePointerDown(event, item)}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onKeyDown={(event) => handleItemKeyDown(event, item)}
                onClick={() => setSelectedId(item.wardrobeItemId)}
                className="outfit-canvas-item absolute flex aspect-square touch-none items-center justify-center rounded-[1rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#202124]"
                data-selected={selected ? "true" : "false"}
                data-cutout={cutoutUrl ? "true" : "false"}
                style={{
                  left: `${item.x * 100}%`,
                  top: `${item.y * 100}%`,
                  width: `${28 * item.scale}%`,
                  zIndex: item.zIndex,
                  transform: transformStyle(item),
                }}
              >
                {imageUrl ? (
                  // biome-ignore lint/performance/noImgElement: Browser-authenticated private images must remain draggable without Next Image proxying.
                  <img
                    src={imageUrl}
                    alt=""
                    draggable={false}
                    className={`pointer-events-none max-h-full max-w-full select-none object-contain ${cutoutUrl ? "drop-shadow-[0_14px_18px_rgba(32,33,36,0.14)]" : "rounded-[0.9rem]"}`}
                  />
                ) : (
                  <span className="rounded-[0.8rem] bg-white/82 px-2 py-2 text-[0.62rem] font-semibold text-[#3f4145]">
                    {wardrobeItem.name}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      <section
        className="surface-card mt-4 rounded-[1.5rem] p-3.5"
        aria-label="画布工具"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {selectedWardrobeItem?.name ?? "选择一件衣物"}
            </p>
            <p className="mt-0.5 text-[0.66rem] text-[var(--text-tertiary)]">
              拖动衣物，方向键可精细调整
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setItems(
                createInitialCanvasItems(
                  items.map((item) => item.wardrobeItemId),
                  new Map(
                    initialData.wardrobeItems.map((item) => [
                      item.id,
                      item.category,
                    ]),
                  ),
                ),
              )
            }
            className="motion-button flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface-soft)] px-3 text-xs font-semibold"
          >
            <Redo2 className="size-3.5" aria-hidden="true" />
            恢复排布
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
          <ToolButton
            label="缩小"
            onClick={() => adjustSelected("scale-down")}
            icon={Minus}
          />
          <ToolButton
            label="放大"
            onClick={() => adjustSelected("scale-up")}
            icon={Plus}
          />
          <ToolButton
            label="左转"
            onClick={() => adjustSelected("rotate-left")}
            icon={RotateCcw}
          />
          <ToolButton
            label="右转"
            onClick={() => adjustSelected("rotate-right")}
            icon={RotateCw}
          />
          <ToolButton
            label="置底"
            onClick={() => moveLayer("back")}
            icon={ArrowDownToLine}
          />
          <ToolButton
            label="置顶"
            onClick={() => moveLayer("front")}
            icon={ArrowUpToLine}
          />
          <ToolButton
            label="左移"
            onClick={() =>
              selectedItem &&
              updateItem(selectedItem.wardrobeItemId, (item) => ({
                ...item,
                x: clampNumber(
                  item.x - 0.025,
                  CANVAS_ITEM_LIMITS.x.min,
                  CANVAS_ITEM_LIMITS.x.max,
                ),
              }))
            }
            icon={ArrowLeft}
          />
          <ToolButton
            label="右移"
            onClick={() =>
              selectedItem &&
              updateItem(selectedItem.wardrobeItemId, (item) => ({
                ...item,
                x: clampNumber(
                  item.x + 0.025,
                  CANVAS_ITEM_LIMITS.x.min,
                  CANVAS_ITEM_LIMITS.x.max,
                ),
              }))
            }
            icon={ArrowRight}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={createProfessionalCutout}
            disabled={
              !selectedWardrobeItem?.imageUrl || Boolean(cutoutPendingId)
            }
            className="motion-button flex min-h-11 items-center justify-center gap-2 rounded-[1rem] bg-[#202124] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {cutoutPendingId ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {selectedId && cutoutUrls[selectedId] ? "重新专业抠图" : "专业抠图"}
          </button>
          <button
            type="button"
            onClick={() => selectedId && setRefineItemId(selectedId)}
            disabled={
              !selectedId || !cutoutUrls[selectedId] || Boolean(cutoutPendingId)
            }
            className="motion-button flex min-h-11 items-center justify-center gap-2 rounded-[1rem] bg-[var(--fashion-lilac-soft)] px-3 text-xs font-semibold text-[#2c2542] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Eraser className="size-4" aria-hidden="true" />
            边缘精修
          </button>
          <button
            type="button"
            onClick={createLocalCutout}
            disabled={
              !selectedWardrobeItem?.imageUrl ||
              Boolean(cutoutPendingId) ||
              Boolean(selectedId && cutoutUrls[selectedId])
            }
            className="motion-button flex min-h-11 items-center justify-center gap-2 rounded-[1rem] bg-[var(--surface-soft)] px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            {cutoutPendingId ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Eraser className="size-4" aria-hidden="true" />
            )}
            简单背景备用
          </button>
          <button
            type="button"
            onClick={removeSelected}
            disabled={items.length <= 2 || !selectedItem}
            className="motion-button flex min-h-11 items-center justify-center gap-2 rounded-[1rem] bg-[var(--surface-soft)] px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            移出画布
          </button>
        </div>
      </section>

      {message ? (
        <output
          className={`motion-status mt-3 rounded-[1rem] px-4 py-3 text-xs leading-5 ${message.tone === "error" ? "bg-[#fff0ed] text-[#9c2f1f]" : message.tone === "success" ? "bg-[#eef8e4] text-[#325821]" : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"}`}
        >
          {message.text}
        </output>
      ) : null}

      <div className="sticky bottom-24 z-20 mt-4 grid grid-cols-2 gap-2 pb-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || title.trim().length === 0}
          className="liquid-glass-web motion-button flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {canvasId ? "保存修改" : "保存卡片"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportPending}
          className="motion-button flex h-12 items-center justify-center gap-2 rounded-full bg-[#202124] text-sm font-semibold text-white disabled:opacity-50"
        >
          {exportPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Share2 className="size-4" aria-hidden="true" />
          )}
          分享图片
        </button>
      </div>
      {refineItemId ? (
        <CutoutRefiner
          itemId={refineItemId}
          itemName={wardrobeMap.get(refineItemId)?.name ?? "当前衣物"}
          originalUrl={wardrobeMap.get(refineItemId)?.imageUrl ?? ""}
          onCancel={() => setRefineItemId(null)}
          onSave={saveRefinement}
        />
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Minus;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-button flex min-h-12 flex-col items-center justify-center gap-1 rounded-[0.9rem] bg-[var(--surface-soft)] text-[0.62rem] font-semibold"
    >
      <Icon className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
      {label}
    </button>
  );
}
