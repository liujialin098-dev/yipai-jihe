"use client";

import {
  Eraser,
  LoaderCircle,
  RotateCcw,
  Save,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type RefinerProps = {
  itemId: string;
  itemName: string;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void>;
};

type BrushMode = "erase" | "restore";
const MAX_EDITOR_EDGE = 1280;

export function CutoutRefiner({
  itemId,
  itemName,
  onCancel,
  onSave,
}: RefinerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const initialRef = useRef<ImageData | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<BrushMode>("erase");
  const [brushSize, setBrushSize] = useState(36);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [originalResponse, sourceResponse] = await Promise.all([
        fetch(`/api/wardrobe/items/${itemId}/cutout/source?asset=original`, {
          cache: "no-store",
        }),
        fetch(`/api/wardrobe/items/${itemId}/cutout/source`, {
          cache: "no-store",
        }),
      ]);
      if (!originalResponse.ok || !sourceResponse.ok) {
        throw new Error("source_missing");
      }
      const [original, source] = await Promise.all([
        createImageBitmap(await originalResponse.blob()),
        createImageBitmap(await sourceResponse.blob()),
      ]);
      const scale = Math.min(
        1,
        MAX_EDITOR_EDGE / Math.max(source.width, source.height),
      );
      const width = Math.max(1, Math.round(source.width * scale));
      const height = Math.max(1, Math.round(source.height * scale));
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("canvas_missing");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("canvas_missing");
      context.clearRect(0, 0, width, height);
      context.drawImage(source, 0, 0, width, height);
      initialRef.current = context.getImageData(0, 0, width, height);

      const originalCanvas = document.createElement("canvas");
      originalCanvas.width = width;
      originalCanvas.height = height;
      const originalContext = originalCanvas.getContext("2d");
      if (!originalContext) throw new Error("canvas_missing");
      originalContext.drawImage(original, 0, 0, width, height);
      originalRef.current = originalCanvas;
      original.close();
      source.close();
    } catch {
      setError("这张衣物还没有可恢复工作图，请先重新执行专业抠图。");
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function paint(from: { x: number; y: number }, to: { x: number; y: number }) {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    if (!canvas || !original) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const step = Math.max(1, brushSize * 0.22);
    const count = Math.max(1, Math.ceil(distance / step));
    for (let index = 0; index <= count; index += 1) {
      const progress = index / count;
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      context.save();
      context.beginPath();
      context.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      context.clip();
      if (mode === "erase") {
        context.globalCompositeOperation = "destination-out";
        context.fillStyle = "#000";
        context.fillRect(
          x - brushSize / 2,
          y - brushSize / 2,
          brushSize,
          brushSize,
        );
      } else {
        context.globalCompositeOperation = "source-over";
        context.drawImage(original, 0, 0);
      }
      context.restore();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(event);
    if (!point || loading || error) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = point;
    paint(point, point);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    const previous = lastPointRef.current;
    if (!point || !previous) return;
    event.preventDefault();
    paint(previous, point);
    lastPointRef.current = point;
  }

  function finishDrawing() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function reset() {
    const canvas = canvasRef.current;
    const initial = initialRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && initial && context) context.putImageData(initial, 0, 0);
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || saving || error) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("png_failed"))),
          "image/png",
          1,
        );
      });
      await onSave(blob);
    } catch {
      setError("精修结果暂时无法保存，当前透明图没有被覆盖。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="cutout-refiner-backdrop fixed inset-0 z-[90] flex items-end justify-center p-2 sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cutout-refiner-title"
    >
      <section className="cutout-refiner-panel w-full max-w-xl overflow-hidden rounded-[1.75rem] bg-[var(--surface-solid)] shadow-[0_28px_90px_rgba(35,26,63,0.34)]">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-4 py-3.5">
          <div className="min-w-0">
            <p className="app-page-meta">边缘精修</p>
            <h2
              id="cutout-refiner-title"
              className="truncate text-base font-semibold"
            >
              {itemName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="motion-button flex size-10 items-center justify-center rounded-full bg-[var(--surface-soft)]"
            aria-label="取消精修"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="cutout-refiner-stage relative m-3 flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[1.35rem]">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-sm text-[var(--text-secondary)]">
              <LoaderCircle
                className="size-5 animate-spin"
                aria-hidden="true"
              />
              正在准备原图和透明图
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrawing}
            onPointerCancel={finishDrawing}
            className={`cutout-refiner-canvas max-h-[54vh] max-w-full touch-none object-contain ${loading || error ? "invisible" : "visible"}`}
            aria-label="透明图精修画布"
          />
          {error ? (
            <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-[1rem] bg-white/92 p-4 text-center text-xs leading-5 text-[#9c2f1f] shadow-lg">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 px-3">
          <button
            type="button"
            onClick={() => setMode("erase")}
            aria-pressed={mode === "erase"}
            className="cutout-refiner-tool motion-button flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold"
          >
            <Eraser className="size-4" aria-hidden="true" />
            擦除背景
          </button>
          <button
            type="button"
            onClick={() => setMode("restore")}
            aria-pressed={mode === "restore"}
            className="cutout-refiner-tool motion-button flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold"
          >
            <Undo2 className="size-4" aria-hidden="true" />
            恢复衣物
          </button>
        </div>

        <fieldset className="mt-3 px-4">
          <legend className="text-xs font-semibold text-[var(--text-secondary)]">
            画笔大小
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              [20, "精细"],
              [36, "标准"],
              [64, "大号"],
            ].map(([size, label]) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(Number(size))}
                aria-pressed={brushSize === size}
                className="cutout-brush-size motion-button min-h-10 rounded-full text-xs font-semibold"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-2 border-t border-[var(--hairline)] p-3">
          <button
            type="button"
            onClick={reset}
            disabled={loading || Boolean(error)}
            className="motion-button flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--surface-soft)] text-sm font-semibold disabled:opacity-45"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            重置
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving || Boolean(error)}
            className="motion-button flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#202124] text-sm font-semibold text-white disabled:opacity-45"
          >
            {saving ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            保存精修
          </button>
        </div>
        <p className="flex items-center justify-center gap-1.5 px-4 pb-4 text-[0.68rem] text-[var(--text-tertiary)]">
          <Sparkles className="size-3" aria-hidden="true" />
          恢复画笔取自原图，取消不会覆盖当前结果
        </p>
      </section>
    </div>
  );
}
