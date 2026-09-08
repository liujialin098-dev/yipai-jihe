"use client";

import { Check, ChevronDown } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  outlinePalette,
  STICKER_OUTLINE_COLORS,
  type StickerOutlineColor,
} from "@/lib/stickers/outline";

const key = "ensemble-sticker-outline-v1";
let current: StickerOutlineColor | null = null;
const listeners = new Set<() => void>();
function readColor() {
  if (current) return current;
  try {
    current = outlinePalette(localStorage.getItem(key)).value;
  } catch {
    current = "white";
  }
  return current;
}
function syncStorage(event: StorageEvent) {
  if (event.key !== key && event.key !== null) return;
  current = null;
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", syncStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", syncStorage);
  };
}
function setColor(value: StickerOutlineColor) {
  current = outlinePalette(value).value;
  try {
    localStorage.setItem(key, current);
  } catch {
    /* 当前页仍可切换。 */
  }
  for (const listener of listeners) listener();
}
export function useStickerOutlineColor() {
  return useSyncExternalStore(
    subscribe,
    readColor,
    () => "white" as StickerOutlineColor,
  );
}

export function StickerOutlineControls({
  compact = false,
}: {
  compact?: boolean;
}) {
  const color = useStickerOutlineColor();
  const choices = (
    <fieldset className="sticker-outline-choices" data-no-swipe>
      <legend className="sr-only">贴纸描边颜色</legend>
      {STICKER_OUTLINE_COLORS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="sticker-outline-choice"
          aria-label={`${option.label}描边`}
          aria-pressed={color === option.value}
          onClick={() => setColor(option.value)}
        >
          <span
            style={{
              backgroundColor: option.color,
              color: option.value === "ink" ? "#ffffff" : "#322a3d",
            }}
          >
            {color === option.value ? (
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
            ) : null}
          </span>
        </button>
      ))}
    </fieldset>
  );
  if (compact)
    return (
      <details className="home-outline-controls" data-no-swipe>
        <summary>
          描边 · {outlinePalette(color).label}
          <ChevronDown size={13} aria-hidden="true" />
        </summary>
        {choices}
      </details>
    );
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-[var(--text-secondary)]">
        贴纸描边
      </p>
      {choices}
    </div>
  );
}
