"use client";

import { Check, ImageOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { saveManualDiaryEntry } from "@/app/diary/actions";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import {
  type DiaryActionState,
  INITIAL_DIARY_ACTION_STATE,
} from "@/lib/diary/validation";
import {
  CATEGORY_OPTIONS,
  OCCASION_OPTIONS,
  optionLabel,
} from "@/lib/wardrobe/constants";

type DiaryComposerItem = {
  category: string;
  cutoutUrl: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
};

type InitialDiaryEntry = {
  itemIds: string[];
  note: string;
  occasion: string;
  title: string;
  wornOn: string;
};

export function DiaryComposer({
  initialEntry,
  items,
  today,
}: {
  initialEntry: InitialDiaryEntry;
  items: DiaryComposerItem[];
  today: string;
}) {
  const [selectedIds, setSelectedIds] = useState(initialEntry.itemIds);
  const [state, formAction, pending] = useActionState(
    async (
      previous: DiaryActionState,
      form: FormData,
    ): Promise<DiaryActionState> => {
      try {
        return await saveManualDiaryEntry(previous, form);
      } catch {
        return {
          status: "error",
          message: "暂时无法保存，衣物和填写内容已保留，请重试。",
        };
      }
    },
    INITIAL_DIARY_ACTION_STATE,
  );

  function toggleItem(itemId: string) {
    setSelectedIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }
      return current.length >= 8 ? current : [...current, itemId];
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const form = new FormData(event.currentTarget);
        // Keep controlled selections and draft text intact after a handled response.
        startTransition(() => formAction(form));
      }}
      className="mt-6 space-y-5"
    >
      <section className="surface-card rounded-[1.65rem] p-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            日期
            <input
              type="date"
              name="wornOn"
              max={today}
              defaultValue={initialEntry.wornOn}
              required
              className="mt-2 h-12 w-full rounded-[1rem] border border-[var(--hairline)] bg-[var(--surface-solid)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)]"
            />
          </label>
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            场合
            <select
              name="occasion"
              defaultValue={initialEntry.occasion}
              className="mt-2 h-12 w-full rounded-[1rem] border border-[var(--hairline)] bg-[var(--surface-solid)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)]"
            >
              {OCCASION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold text-[var(--text-secondary)]">
          标题
          <input
            type="text"
            name="title"
            minLength={1}
            maxLength={40}
            defaultValue={initialEntry.title}
            required
            placeholder="例如：周五轻松通勤"
            className="mt-2 h-12 w-full rounded-[1rem] border border-[var(--hairline)] bg-[var(--surface-solid)] px-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--system-blue)]"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold text-[var(--text-secondary)]">
          短记（可选）
          <textarea
            name="note"
            maxLength={160}
            defaultValue={initialEntry.note}
            rows={3}
            placeholder="实际体感、活动或下次想调整的地方"
            className="mt-2 w-full resize-none rounded-[1rem] border border-[var(--hairline)] bg-[var(--surface-solid)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--system-blue)]"
          />
        </label>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="app-section-title">选择实际穿着的衣物</h2>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              最少 1 件，最多 8 件
            </p>
          </div>
          <span className="rounded-full bg-[var(--system-blue-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--system-blue)]">
            {selectedIds.length}/8
          </span>
        </div>

        {items.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {items.map((item, index) => {
              const selected = selectedIds.includes(item.id);
              const unavailable = !selected && selectedIds.length >= 8;
              return (
                <label
                  key={item.id}
                  className={`surface-card pressable stagger-item relative min-w-0 cursor-pointer rounded-[1.45rem] p-2.5 ${
                    selected
                      ? "ring-2 ring-[var(--system-blue)] ring-offset-2 ring-offset-[var(--background)]"
                      : unavailable
                        ? "opacity-45"
                        : ""
                  }`}
                  style={
                    { "--stagger": Math.min(index, 8) } as React.CSSProperties
                  }
                >
                  <input
                    type="checkbox"
                    name="itemIds"
                    value={item.id}
                    checked={selected}
                    disabled={pending || unavailable}
                    onChange={() => toggleItem(item.id)}
                    className="sr-only"
                  />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.05rem] bg-[var(--surface-soft)]">
                    {item.cutoutUrl || item.imageUrl ? (
                      <GarmentSticker
                        imageUrl={item.imageUrl}
                        cutoutUrl={item.cutoutUrl}
                        alt={item.name}
                        sizes="(max-width: 480px) 44vw, 210px"
                        className="size-full rounded-[1.05rem]"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[var(--text-tertiary)]">
                        <ImageOff className="size-5" aria-hidden="true" />
                      </span>
                    )}
                    {selected ? (
                      <span className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg">
                        <Check className="size-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                  <div className="px-1 pt-3 pb-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[0.68rem] text-[var(--text-tertiary)]">
                      {optionLabel(CATEGORY_OPTIONS, item.category)}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.45rem] border border-dashed border-[var(--hairline-strong)] px-5 py-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              当前衣着偏好下还没有可选衣物。
            </p>
            <Link
              href="/wardrobe"
              className="mt-3 inline-block text-sm font-semibold text-[var(--system-blue)]"
            >
              先去整理衣橱
            </Link>
          </div>
        )}
      </section>

      <div className="sticky bottom-24 z-10 rounded-[1.4rem] bg-[var(--surface)]/94 p-2 shadow-[0_18px_50px_rgba(48,52,61,0.18)] backdrop-blur-xl">
        <button
          type="submit"
          disabled={pending || selectedIds.length === 0}
          className="motion-button flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)] disabled:opacity-45"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          {pending ? "正在保存" : "保存这天的穿搭"}
        </button>
      </div>

      {state.message ? (
        <div
          aria-live="polite"
          className={`rounded-[1.15rem] px-4 py-3 text-sm leading-6 ${
            state.status === "error"
              ? "bg-[var(--danger-surface)] text-[var(--danger-text)]"
              : "bg-[var(--success-surface)] text-[var(--success-text)]"
          }`}
        >
          {state.message}
          {state.status === "success" ? (
            <Link
              href="/diary"
              className="ml-1 font-semibold underline underline-offset-2"
            >
              返回日记
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
