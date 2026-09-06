"use client";

import {
  AlertCircle,
  Check,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WARDROBE_AUDIENCE_OPTIONS } from "@/lib/personalization/constants";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/wardrobe/constants";
import type {
  WardrobeItemInput,
  WardrobeRecognition,
} from "@/lib/wardrobe/validation";

type ItemStatus =
  | "selected"
  | "uploading"
  | "recognizing"
  | "recognized"
  | "failed"
  | "manual"
  | "confirming"
  | "confirmed";

type QueueItem = {
  localId: string;
  clientRequestId: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  fields: WardrobeItemInput;
  suggestion: WardrobeRecognition | null;
  ingestionId: string | null;
  wardrobeItemId: string | null;
  selectedForConfirm: boolean;
  error: string | null;
  recognitionMs: number | null;
};

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const CONCURRENCY = 3;
const CONFIRM_CONCURRENCY = 2;

const DEFAULT_FIELDS: WardrobeItemInput = {
  audience: "unisex",
  brand: null,
  name: "待确认衣物",
  category: "tops",
  primary_color: "black",
  material: "cotton",
  style: "casual",
  seasons: ["spring"],
  occasions: ["casual"],
};

export function IngestionWorkspace() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function patchItem(localId: string, patch: Partial<QueueItem>) {
    setItems((current) =>
      current.map((item) =>
        item.localId === localId ? { ...item, ...patch } : item,
      ),
    );
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const available = MAX_FILES - items.length;
    const selected = Array.from(fileList);
    const accepted = selected.slice(0, Math.max(available, 0));
    const valid: QueueItem[] = [];
    const errors: string[] = [];

    for (const file of accepted) {
      if (file.type !== "image/jpeg" && file.type !== "image/png") {
        errors.push(`${file.name} 不是 jpg 或 png`);
        continue;
      }
      if (file.size < 1 || file.size > MAX_BYTES) {
        errors.push(`${file.name} 必须小于 10MB`);
        continue;
      }
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .trim()
        .slice(0, 60);
      valid.push({
        localId: crypto.randomUUID(),
        clientRequestId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "selected",
        fields: { ...DEFAULT_FIELDS, name: baseName || DEFAULT_FIELDS.name },
        suggestion: null,
        ingestionId: null,
        wardrobeItemId: null,
        selectedForConfirm: true,
        error: null,
        recognitionMs: null,
      });
    }

    if (selected.length > available) errors.push(`单批最多 ${MAX_FILES} 张`);
    setItems((current) => [...current, ...valid]);
    setNotice(errors.length > 0 ? errors[0] : null);
  }

  async function processItem(item: QueueItem) {
    patchItem(item.localId, { status: "uploading", error: null });
    try {
      const createResponse = await fetch("/api/wardrobe/ingestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: item.clientRequestId,
          mimeType: item.file.type,
          byteSize: item.file.size,
        }),
      });
      const created = await readJson(createResponse);
      if (!createResponse.ok || !isUploadTicket(created)) {
        throw new Error(errorMessage(created, "无法准备上传"));
      }

      patchItem(item.localId, { ingestionId: created.ingestionId });
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("wardrobe-images")
        .uploadToSignedUrl(created.path, created.token, item.file, {
          contentType: item.file.type,
          upsert: true,
        });
      if (uploadError) throw new Error("原图上传失败，请重试");

      patchItem(item.localId, { status: "recognizing" });
      const recognitionResponse = await fetch(
        `/api/wardrobe/ingestions/${created.ingestionId}/recognize`,
        { method: "POST" },
      );
      const recognized = await readJson(recognitionResponse);
      if (!recognitionResponse.ok || !isRecognitionResponse(recognized)) {
        throw new Error(errorMessage(recognized, "识别失败，可手工填写"));
      }

      patchItem(item.localId, {
        status: "recognized",
        fields: toWardrobeFields(recognized.result),
        suggestion: recognized.result,
        recognitionMs: recognized.recognitionMs,
        error: null,
      });
    } catch (error) {
      patchItem(item.localId, {
        status: "failed",
        error: error instanceof Error ? error.message : "处理失败，可重试",
      });
    }
  }

  async function recognizePending() {
    const pending = items.filter(
      (item) => item.status === "selected" || item.status === "failed",
    );
    if (pending.length === 0) return;
    setBusy(true);
    setNotice(null);
    await runPool(pending, CONCURRENCY, processItem);
    setBusy(false);
  }

  async function confirmItem(item: QueueItem) {
    if (!item.ingestionId) {
      patchItem(item.localId, { error: "请先完成原图上传" });
      return false;
    }
    patchItem(item.localId, { status: "confirming", error: null });
    try {
      const response = await fetch(
        `/api/wardrobe/ingestions/${item.ingestionId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.fields),
        },
      );
      const payload = await readJson(response);
      if (!response.ok || !isConfirmResponse(payload)) {
        throw new Error(errorMessage(payload, "入库失败，请重试"));
      }
      patchItem(item.localId, {
        status: "confirmed",
        wardrobeItemId: payload.wardrobeItemId,
        error: null,
      });
      return true;
    } catch (error) {
      patchItem(item.localId, {
        status: item.suggestion ? "recognized" : "manual",
        error: error instanceof Error ? error.message : "入库失败，请重试",
      });
      return false;
    }
  }

  async function confirmSelected() {
    const ready = items.filter(
      (item) =>
        item.selectedForConfirm &&
        ["recognized", "failed", "manual"].includes(item.status),
    );
    if (ready.length === 0) {
      setNotice("请先选择至少一件可入库衣物");
      return;
    }
    setBusy(true);
    const results: boolean[] = [];
    await runPool(ready, CONFIRM_CONCURRENCY, async (item) => {
      results.push(await confirmItem(item));
    });
    const successCount = results.filter(Boolean).length;
    setNotice(
      `已入库 ${successCount} 件，${ready.length - successCount} 件待处理。`,
    );
    setBusy(false);
  }

  async function removeItem(item: QueueItem) {
    if (item.status === "confirmed") return;
    if (item.ingestionId) {
      const response = await fetch(
        `/api/wardrobe/ingestions/${item.ingestionId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setNotice("暂时无法清理这张原图，请稍后重试");
        return;
      }
    }
    URL.revokeObjectURL(item.previewUrl);
    setItems((current) =>
      current.filter((entry) => entry.localId !== item.localId),
    );
  }

  function resetCompletedBatch() {
    if (
      busy ||
      items.length !== MAX_FILES ||
      items.some((item) => item.status !== "confirmed")
    ) {
      return;
    }
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    setItems([]);
    setNotice("上一批 10 件已入库，可以继续选择下一批。");
    requestAnimationFrame(() => {
      document
        .getElementById("wardrobe-upload-picker")
        ?.scrollIntoView({ block: "start" });
    });
  }

  const actionableCount = items.filter((item) =>
    ["selected", "failed"].includes(item.status),
  ).length;
  const confirmableCount = items.filter(
    (item) =>
      item.selectedForConfirm &&
      ["recognized", "failed", "manual"].includes(item.status),
  ).length;
  const confirmedCount = items.filter(
    (item) => item.status === "confirmed",
  ).length;
  const batchComplete =
    items.length === MAX_FILES && confirmedCount === MAX_FILES;

  return (
    <div className="pb-8">
      <label
        id="wardrobe-upload-picker"
        className="pressable surface-card mt-6 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[var(--hairline)] px-6 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-[#1d1d1f] text-white shadow-[0_12px_24px_rgba(29,29,31,0.2)]">
          <ImagePlus className="size-5" aria-hidden="true" />
        </span>
        <span className="mt-4 text-sm font-semibold text-[var(--foreground)]">
          拍照或从相册选择
        </span>
        <span className="mt-1 text-xs text-[var(--text-tertiary)]">
          jpg / png · 单张 10MB 内 · 最多 10 张
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          capture="environment"
          multiple
          disabled={items.length >= MAX_FILES || busy}
          onChange={(event) => {
            addFiles(event.target.files);
            event.currentTarget.value = "";
          }}
          className="sr-only"
        />
      </label>

      {notice ? (
        <p
          className="mt-3 rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]"
          aria-live="polite"
        >
          {notice}
        </p>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="app-page-meta">
                待处理 {items.length}/{MAX_FILES}
              </p>
              <h2 className="app-section-title mt-1">核对衣物信息</h2>
            </div>
            <p className="shrink-0 text-xs text-[var(--text-tertiary)]">
              已完成 {confirmedCount}
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            {items.map((item) => (
              <IngestionCard
                key={item.localId}
                item={item}
                onPatch={(patch) => patchItem(item.localId, patch)}
                onRetry={() => processItem(item)}
                onConfirm={() => confirmItem(item)}
                onRemove={() => removeItem(item)}
              />
            ))}
          </div>

          {batchComplete ? (
            <div className="sticky bottom-[5.8rem] z-20 mt-5 grid grid-cols-[1.35fr_1fr] gap-2 rounded-[1.35rem] border border-white/70 bg-white/85 p-2 shadow-[0_18px_44px_rgba(29,29,31,0.15)] backdrop-blur-2xl">
              <button
                type="button"
                onClick={resetCompletedBatch}
                className="motion-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(29,29,31,0.2)]"
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                继续添加衣服
              </button>
              <Link
                href="/wardrobe"
                className="pressable inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--hairline)] px-4 text-sm font-semibold text-[var(--foreground)]"
              >
                查看衣橱
              </Link>
            </div>
          ) : (
            <div className="sticky bottom-[5.8rem] z-20 mt-5 grid grid-cols-[auto_1fr] gap-2 rounded-[1.35rem] border border-white/70 bg-white/85 p-2 shadow-[0_18px_44px_rgba(29,29,31,0.15)] backdrop-blur-2xl">
              <button
                type="button"
                disabled={busy || actionableCount === 0}
                onClick={recognizePending}
                className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--hairline)] px-4 text-sm font-semibold disabled:opacity-45"
              >
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                识别 {actionableCount || ""}
              </button>
              <button
                type="button"
                disabled={busy || confirmableCount === 0}
                onClick={confirmSelected}
                className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(29,29,31,0.2)] disabled:opacity-45"
              >
                <Upload className="size-4" />
                入库 {confirmableCount || ""}
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function IngestionCard({
  item,
  onPatch,
  onRetry,
  onConfirm,
  onRemove,
}: {
  item: QueueItem;
  onPatch: (patch: Partial<QueueItem>) => void;
  onRetry: () => void;
  onConfirm: () => void;
  onRemove: () => void;
}) {
  const locked = [
    "uploading",
    "recognizing",
    "confirming",
    "confirmed",
  ].includes(item.status);
  const updateField = <K extends keyof WardrobeItemInput>(
    key: K,
    value: WardrobeItemInput[K],
  ) => {
    onPatch({
      fields: { ...item.fields, [key]: value },
      status: item.status === "failed" ? "manual" : item.status,
    });
  };

  return (
    <article className="surface-card overflow-hidden rounded-[1.75rem]">
      <div className="grid grid-cols-[7.5rem_1fr] gap-4 p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-[var(--surface-soft)]">
          <Image
            src={item.previewUrl}
            alt="待识别衣物原图"
            fill
            unoptimized
            sizes="120px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <StatusLabel item={item} />
              <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">
                {item.file.name}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                {(item.file.size / 1024 / 1024).toFixed(1)}MB
                {item.recognitionMs
                  ? ` · ${(item.recognitionMs / 1000).toFixed(1)}秒`
                  : ""}
              </p>
            </div>
            {item.status !== "confirmed" ? (
              <button
                type="button"
                onClick={onRemove}
                disabled={locked}
                aria-label="移除这张图片"
                className="pressable flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>

          {item.error ? (
            <p className="mt-3 flex gap-1.5 text-xs leading-5 text-[#c9342f]">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {item.error}
            </p>
          ) : item.suggestion?.note ? (
            <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
              {item.suggestion.note}
            </p>
          ) : null}

          {item.status === "failed" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3 text-xs font-semibold text-white"
              >
                <RefreshCw className="size-3.5" />
                重试识别
              </button>
              <button
                type="button"
                onClick={() => onPatch({ status: "manual", error: null })}
                className="pressable min-h-9 rounded-full border border-[var(--hairline)] px-3 text-xs font-semibold"
              >
                手工填写
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {["recognized", "failed", "manual"].includes(item.status) ? (
        <div className="border-t border-[var(--hairline)] p-4">
          <Field label="衣物名称">
            <input
              aria-label="衣物名称"
              value={item.fields.name}
              maxLength={60}
              onChange={(event) => updateField("name", event.target.value)}
              className="field-control"
            />
          </Field>
          <Field label="品牌（可选）">
            <input
              aria-label="品牌"
              value={item.fields.brand ?? ""}
              maxLength={40}
              placeholder="无清晰标识时留空"
              onChange={(event) => updateField("brand", event.target.value)}
              className="field-control"
            />
          </Field>
          {item.suggestion ? (
            <p className="mt-1 text-[11px] leading-5 text-[var(--text-tertiary)]">
              品牌识别：
              {item.suggestion.brand_confidence === "unknown"
                ? "未发现清晰标识"
                : `${item.suggestion.brand ?? "待核对"} · ${item.suggestion.brand_confidence === "high" ? "高置信" : item.suggestion.brand_confidence === "medium" ? "中置信" : "低置信"}`}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <SelectField
              label="类别"
              value={item.fields.category}
              options={CATEGORY_OPTIONS}
              onChange={(value) =>
                updateField("category", value as WardrobeItemInput["category"])
              }
            />
            <SelectField
              label="主色"
              value={item.fields.primary_color}
              options={COLOR_OPTIONS}
              onChange={(value) =>
                updateField(
                  "primary_color",
                  value as WardrobeItemInput["primary_color"],
                )
              }
            />
            <SelectField
              label="材质"
              value={item.fields.material}
              options={MATERIAL_OPTIONS}
              onChange={(value) =>
                updateField("material", value as WardrobeItemInput["material"])
              }
            />
            <SelectField
              label="风格"
              value={item.fields.style}
              options={STYLE_OPTIONS}
              onChange={(value) =>
                updateField("style", value as WardrobeItemInput["style"])
              }
            />
            <SelectField
              label="衣着归属"
              value={item.fields.audience}
              options={WARDROBE_AUDIENCE_OPTIONS}
              onChange={(value) =>
                updateField("audience", value as WardrobeItemInput["audience"])
              }
            />
          </div>
          <ChoiceField
            label="季节"
            className="mt-3"
            options={SEASON_OPTIONS}
            selected={item.fields.seasons}
            onChange={(value) =>
              updateField("seasons", value as WardrobeItemInput["seasons"])
            }
          />
          <ChoiceField
            label="场合"
            className="mt-3"
            options={OCCASION_OPTIONS}
            selected={item.fields.occasions}
            onChange={(value) =>
              updateField("occasions", value as WardrobeItemInput["occasions"])
            }
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={item.selectedForConfirm}
                onChange={(event) =>
                  onPatch({ selectedForConfirm: event.target.checked })
                }
                className="size-4 accent-[#1d1d1f]"
              />
              加入本次入库
            </label>
            <button
              type="button"
              onClick={onConfirm}
              className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 text-xs font-semibold text-white"
            >
              确认这件
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {item.status === "confirmed" && item.wardrobeItemId ? (
        <Link
          href={`/wardrobe/${item.wardrobeItemId}`}
          className="pressable flex min-h-12 items-center justify-between border-t border-[var(--hairline)] px-4 text-sm font-semibold text-[var(--system-blue)]"
        >
          已放入衣橱，查看详情
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </article>
  );
}

function StatusLabel({ item }: { item: QueueItem }) {
  const pending = ["uploading", "recognizing", "confirming"].includes(
    item.status,
  );
  const labels: Record<ItemStatus, string> = {
    selected: "等待识别",
    uploading: "上传原图",
    recognizing: "AI 识别中",
    recognized: "等待核对",
    failed: "需要处理",
    manual: "手工填写",
    confirming: "正在入库",
    confirmed: "已入库",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--system-blue)]">
      {pending ? (
        <LoaderCircle className="size-3 animate-spin" />
      ) : item.status === "confirmed" ? (
        <Check className="size-3" />
      ) : (
        <Sparkles className="size-3" />
      )}
      {labels[item.status]}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
      <span>{label}</span>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-control"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function ChoiceField({
  className,
  label,
  options,
  selected,
  onChange,
}: {
  className?: string;
  label: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className={className}>
      <legend className="text-xs font-semibold text-[var(--text-secondary)]">
        {label}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = active
                  ? selected.filter((value) => value !== option.value)
                  : [...selected, option.value];
                if (next.length > 0) onChange(next);
              }}
              className={`pressable min-h-8 rounded-full px-3 text-[11px] font-semibold ${
                active
                  ? "bg-[#1d1d1f] text-white"
                  : "border border-[var(--hairline)] text-[var(--text-secondary)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

async function runPool<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<unknown>,
) {
  let index = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (index < values.length) {
        const current = values[index];
        index += 1;
        await worker(current);
      }
    },
  );
  await Promise.all(runners);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(value: unknown, fallback: string) {
  if (!isObject(value) || !isObject(value.error)) return fallback;
  return typeof value.error.message === "string"
    ? value.error.message
    : fallback;
}

function isUploadTicket(
  value: unknown,
): value is { ingestionId: string; path: string; token: string } {
  return (
    isObject(value) &&
    typeof value.ingestionId === "string" &&
    typeof value.path === "string" &&
    typeof value.token === "string"
  );
}

function isRecognitionResponse(value: unknown): value is {
  result: WardrobeRecognition;
  recognitionMs: number;
} {
  return (
    isObject(value) &&
    isObject(value.result) &&
    typeof value.recognitionMs === "number"
  );
}

function isConfirmResponse(
  value: unknown,
): value is { wardrobeItemId: string } {
  return isObject(value) && typeof value.wardrobeItemId === "string";
}

function toWardrobeFields(result: WardrobeRecognition): WardrobeItemInput {
  return {
    audience: result.audience,
    brand: result.brand,
    name: result.name,
    category: result.category,
    primary_color: result.primary_color,
    material: result.material,
    style: result.style,
    seasons: result.seasons,
    occasions: result.occasions,
  };
}
