"use client";

import {
  Check,
  ChevronDown,
  Shuffle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import {
  recommendationOccasionLabel,
  type RecommendationOccasion,
} from "@/lib/recommendations/constants";
import {
  AUTO_STYLE_FOCUS,
  OCCASION_STYLE_OPTIONS,
  type RecommendationStyleFocus,
} from "@/lib/recommendations/style-direction";
import { STYLE_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";

export function RecommendationStylePicker({
  occasion,
  value,
  onChange,
  disabled,
}: {
  occasion: RecommendationOccasion;
  value: RecommendationStyleFocus;
  onChange: (value: RecommendationStyleFocus) => void;
  disabled: boolean;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const auto = value === AUTO_STYLE_FOCUS;
  const title = auto ? "自动搭配" : optionLabel(STYLE_OPTIONS, value);

  function close() {
    setOpen(false);
    dialog.current?.close();
  }

  return (
    <div className="recommendation-style-picker">
      <p className="recommendation-style-label">想要什么风格</p>
      <button
        type="button"
        className="recommendation-style-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
          dialog.current
            ?.querySelector<HTMLInputElement>("input:checked")
            ?.focus({ preventScroll: true });
        }}
      >
        <span className="recommendation-style-symbol" aria-hidden="true">
          {auto ? <Shuffle size={24} /> : <SlidersHorizontal size={24} />}
        </span>
        <span className="recommendation-style-copy">
          <strong>{title}</strong>
          <span>
            {auto
              ? "三套不同灵感"
              : `${recommendationOccasionLabel(occasion)} · 按这个风格搭配`}
          </span>
        </span>
        <span className="recommendation-style-chevron">
          <ChevronDown size={20} aria-hidden="true" />
        </span>
      </button>

      <dialog
        ref={dialog}
        id={id}
        aria-labelledby={`${id}-title`}
        className="recommendation-style-sheet"
        data-no-swipe
        onClose={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }}
      >
        <div className="recommendation-sheet-handle" aria-hidden="true" />
        <header className="recommendation-sheet-header">
          <div>
            <p>{recommendationOccasionLabel(occasion)}</p>
            <h2 id={`${id}-title`}>这次，想怎么穿？</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="recommendation-sheet-close"
            aria-label="关闭风格选择"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        <fieldset disabled={disabled} className="recommendation-style-options">
          <legend className="sr-only">选择搭配风格</legend>
          {[AUTO_STYLE_FOCUS, ...OCCASION_STYLE_OPTIONS[occasion]].map(
            (style) => (
              <label
                key={style}
                className="recommendation-style-option"
                data-auto={style === AUTO_STYLE_FOCUS}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name={`${id}-style-choice`}
                  value={style}
                  checked={value === style}
                  onChange={() => {
                    onChange(style);
                    close();
                  }}
                  onClick={() => {
                    if (value === style) close();
                  }}
                />
                <span className="recommendation-style-option-face">
                  {style === AUTO_STYLE_FOCUS ? (
                    <Shuffle size={22} aria-hidden="true" />
                  ) : null}
                  <span>
                    <strong>
                      {style === AUTO_STYLE_FOCUS
                        ? "自动搭配"
                        : optionLabel(STYLE_OPTIONS, style)}
                    </strong>
                    {style === AUTO_STYLE_FOCUS ? (
                      <small>试试三种不同的感觉</small>
                    ) : null}
                  </span>
                  <Check
                    className="recommendation-style-check"
                    size={18}
                    aria-hidden="true"
                  />
                </span>
              </label>
            ),
          )}
        </fieldset>
      </dialog>
    </div>
  );
}
