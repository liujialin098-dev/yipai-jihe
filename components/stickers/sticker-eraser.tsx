"use client";

import { Eraser, Paintbrush, RotateCcw, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  paintStickerBrush,
  type BrushPoint,
} from "@/lib/stickers/eraser-brush";

export function StickerEraser({
  itemId,
  name,
  onCancel,
  onSaved,
}: {
  itemId: string;
  name: string;
  onCancel: () => void;
  onSaved: (url: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const history = useRef<ImageData[]>([]);
  const stroke = useRef<{
    id: number;
    point: BrushPoint;
    before: ImageData;
  } | null>(null);
  const version = useRef("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [restore, setRestore] = useState(false);
  const [brush, setBrush] = useState(24);
  const [backdrop, setBackdrop] = useState<"light" | "dark">("dark");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [cursor, setCursor] = useState<BrushPoint | null>(null);

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry explicitly reloads a failed source request.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    let disposed = false;
    setReady(false);
    setMessage("");
    async function load() {
      try {
        const response = await fetch(`/api/stickers/items/${itemId}/refine`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("load");
        const tag = response.headers.get("etag");
        if (!tag) throw new Error("version");
        const bitmap = await createImageBitmap(await response.blob());
        try {
          if (disposed || !canvas.current) return;
          const scale = Math.min(
            1,
            1280 / Math.max(bitmap.width, bitmap.height),
          );
          const initial = document.createElement("canvas");
          initial.width = Math.max(1, Math.round(bitmap.width * scale));
          initial.height = Math.max(1, Math.round(bitmap.height * scale));
          const context = initial.getContext("2d");
          const current = canvas.current.getContext("2d", {
            willReadFrequently: true,
          });
          if (!context || !current) throw new Error("canvas");
          context.drawImage(bitmap, 0, 0, initial.width, initial.height);
          canvas.current.width = initial.width;
          canvas.current.height = initial.height;
          current.drawImage(initial, 0, 0);
          base.current = initial;
          version.current = tag;
          history.current = [];
          setUndoCount(0);
          setDirty(false);
          setReady(true);
        } finally {
          bitmap.close();
        }
      } catch {
        if (!disposed) setMessage("贴纸加载失败，请重试。当前图片没有被修改。");
      } finally {
        clearTimeout(timer);
      }
    }
    void load();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [itemId, retry]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * event.currentTarget.width) / rect.width,
      y:
        ((event.clientY - rect.top) * event.currentTarget.height) / rect.height,
    };
  }
  function paint(from: BrushPoint, to: BrushPoint) {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context || !base.current) return;
    const ratio = element.width / element.getBoundingClientRect().width;
    paintStickerBrush(
      context,
      base.current,
      from,
      to,
      (brush * ratio) / 2,
      restore,
    );
  }
  function begin(event: PointerEvent<HTMLCanvasElement>) {
    if (
      !ready ||
      saving ||
      !event.isPrimary ||
      event.button !== 0 ||
      stroke.current
    )
      return;
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const current = point(event);
    stroke.current = {
      id: event.pointerId,
      point: current,
      before: context.getImageData(
        0,
        0,
        event.currentTarget.width,
        event.currentTarget.height,
      ),
    };
    paint(current, current);
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    if (stroke.current?.id !== event.pointerId || saving) return;
    event.preventDefault();
    const next = point(event);
    paint(stroke.current.point, next);
    stroke.current.point = next;
  }
  function finish(event: PointerEvent<HTMLCanvasElement>, cancel = false) {
    const current = stroke.current;
    if (!current || current.id !== event.pointerId) return;
    if (cancel)
      canvas.current?.getContext("2d")?.putImageData(current.before, 0, 0);
    else {
      paint(current.point, point(event));
      history.current = [...history.current.slice(-5), current.before];
      setUndoCount(history.current.length);
      setDirty(true);
    }
    stroke.current = null;
    setCursor(null);
  }
  function undo() {
    const previous = history.current.pop();
    if (previous)
      canvas.current?.getContext("2d")?.putImageData(previous, 0, 0);
    setUndoCount(history.current.length);
  }
  function requestClose() {
    if (saving) return;
    if (dirty) setDiscardOpen(true);
    else onCancel();
  }
  function reset() {
    const context = canvas.current?.getContext("2d");
    if (!context || !base.current) return;
    context.clearRect(0, 0, base.current.width, base.current.height);
    context.drawImage(base.current, 0, 0);
    history.current = [];
    setUndoCount(0);
    setDirty(false);
    setMessage("");
  }
  async function save() {
    if (!canvas.current || !dirty || saving || stroke.current) return;
    setSaving(true);
    setMessage("");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.current?.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("save");
      const response = await fetch(`/api/stickers/items/${itemId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "image/png", "If-Match": version.current },
        body: blob,
        signal: AbortSignal.timeout(40_000),
      });
      if (!response.ok) {
        setMessage(
          response.status === 409
            ? "贴纸已在别处更新。请退出后重新编辑，避免覆盖新版本。"
            : response.status === 422
              ? "请至少保留一部分衣物，不可保存空白贴纸。"
              : response.status === 413
                ? "图片过大，暂时无法保存；请取消并使用更小的源图片。"
                : "保存未确认，请重试。退出前请保留当前编辑。",
        );
        return;
      }
      const result = await response.json();
      if (typeof result.cutoutUrl !== "string") throw new Error("response");
      onSaved(result.cutoutUrl);
    } catch {
      setMessage("保存未确认，请检查连接后重试。当前编辑仍在。");
    } finally {
      setSaving(false);
    }
  }
  const toolClass =
    "motion-button flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold disabled:opacity-40";
  return (
    <dialog
      ref={dialog}
      aria-labelledby="sticker-eraser-title"
      data-no-swipe
      className="sticker-eraser-dialog m-auto w-[calc(100%_-_1.5rem)] max-w-lg max-h-[92dvh] overflow-y-auto rounded-[1.8rem] bg-[var(--surface-solid)] p-4 text-[var(--text-primary)] shadow-2xl backdrop:bg-black/45"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="sticker-eraser-title" className="text-base font-semibold">
            橡皮擦
          </h2>
          <p className="truncate text-xs text-[var(--text-secondary)]">
            {name}
          </p>
        </div>
        <button
          type="button"
          aria-label="取消编辑"
          disabled={saving}
          onClick={requestClose}
          className={toolClass}
        >
          <X className="size-5" />
        </button>
      </header>
      <p className="my-3 text-xs leading-5 text-[var(--text-secondary)]">
        擦掉多余部分；恢复只还原本次擦除。保存将更新这件衣服的贴纸，原照片不变。
      </p>
      <div
        className="flex justify-center overflow-hidden rounded-[1.3rem] p-3"
        style={{ background: backdrop === "dark" ? "#382f43" : "#f0eaf7" }}
      >
        <div className="relative w-fit max-w-full leading-none">
          <canvas
            ref={canvas}
            aria-label="衣物擦除画布，拖动擦除，切换恢复可还原本次修改"
            className="max-h-[44dvh] max-w-full touch-none object-contain"
            style={{ width: "auto", height: "auto", opacity: ready ? 1 : 0 }}
            onPointerDown={begin}
            onPointerMove={move}
            onPointerUp={(event) => finish(event)}
            onPointerCancel={(event) => finish(event, true)}
            onLostPointerCapture={(event) => {
              if (stroke.current) finish(event, true);
            }}
            onPointerLeave={() => {
              if (!stroke.current) setCursor(null);
            }}
          />
          {ready && cursor ? (
            <span
              className="pointer-events-none absolute rounded-full border-2 border-white shadow-[0_0_0_1px_#382f43]"
              style={{
                left: cursor.x,
                top: cursor.y,
                width: brush,
                height: brush,
                transform: "translate(-50%,-50%)",
              }}
            />
          ) : null}
        </div>
      </div>
      {!ready ? (
        <output className="my-3 block text-sm">
          {message || "正在加载贴纸…"}
        </output>
      ) : null}
      {!ready && message ? (
        <button
          type="button"
          className={toolClass}
          onClick={() => setRetry((value) => value + 1)}
        >
          重新加载
        </button>
      ) : null}
      <fieldset
        disabled={!ready || saving}
        className="mt-4 space-y-3 disabled:opacity-50"
      >
        <legend className="sr-only">擦除工具</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={!restore}
            className={`${toolClass} ${!restore ? "bg-[var(--fashion-lilac)] text-[#28222e]" : "bg-[var(--surface-soft)]"}`}
            onClick={() => setRestore(false)}
          >
            <Eraser className="size-4" />
            擦除
          </button>
          <button
            type="button"
            aria-pressed={restore}
            className={`${toolClass} ${restore ? "bg-[var(--fashion-lilac)] text-[#28222e]" : "bg-[var(--surface-soft)]"}`}
            onClick={() => setRestore(true)}
          >
            <Paintbrush className="size-4" />
            恢复
          </button>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-xs">
          笔刷
          <input
            className="sticker-tool-range min-w-0 flex-1"
            type="range"
            min="8"
            max="64"
            step="2"
            value={brush}
            onChange={(event) => setBrush(Number(event.target.value))}
          />
          <span className="w-10 text-right">{brush}px</span>
        </label>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            className={toolClass}
            disabled={!undoCount}
            onClick={undo}
          >
            <Undo2 className="size-4" />
            撤销
          </button>
          <button type="button" className={toolClass} onClick={reset}>
            <RotateCcw className="size-4" />
            重置
          </button>
          <button
            type="button"
            className={toolClass}
            onClick={() =>
              setBackdrop((value) => (value === "dark" ? "light" : "dark"))
            }
          >
            {backdrop === "dark" ? "浅色底" : "深色底"}
          </button>
        </div>
      </fieldset>
      {ready && message ? (
        <output className="my-3 block text-xs leading-5 text-[var(--text-secondary)]">
          {message}
        </output>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`${toolClass} bg-[var(--surface-soft)]`}
          disabled={saving}
          onClick={requestClose}
        >
          取消
        </button>
        <button
          type="button"
          className={`${toolClass} bg-[#29232f] text-white`}
          disabled={!ready || !dirty || saving}
          onClick={save}
        >
          {saving ? "保存中…" : "保存贴纸"}
        </button>
      </div>
      {discardOpen ? (
        <section
          aria-label="放弃编辑确认"
          className="mt-3 rounded-xl bg-[var(--surface-soft)] p-3"
        >
          <p className="text-sm">放弃这次未保存的修改？</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={toolClass}
              onClick={() => setDiscardOpen(false)}
            >
              继续编辑
            </button>
            <button type="button" className={toolClass} onClick={onCancel}>
              放弃修改
            </button>
          </div>
        </section>
      ) : null}
    </dialog>
  );
}
