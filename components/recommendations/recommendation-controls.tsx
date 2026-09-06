"use client";

import { LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { useActionState, useState } from "react";
import { generateDailyRecommendations } from "@/app/recommendations/actions";
import { useRecommendationWeather } from "./weather-panel";
import {
  INITIAL_RECOMMENDATION_ACTION_STATE,
  RECOMMENDATION_OCCASIONS,
  type RecommendationOccasion,
  type RecommendationTargetDay,
} from "@/lib/recommendations/constants";
import {
  AUTO_STYLE_FOCUS,
  OCCASION_STYLE_OPTIONS,
  type RecommendationStyleFocus,
} from "@/lib/recommendations/style-direction";
import { STYLE_OPTIONS, optionLabel } from "@/lib/wardrobe/constants";

export function RecommendationControls({
  defaultOccasion,
  hasRecommendation,
  targetDay,
}: {
  defaultOccasion: RecommendationOccasion;
  hasRecommendation: boolean;
  targetDay: RecommendationTargetDay;
}) {
  const [state, action, pending] = useActionState(
    generateDailyRecommendations,
    INITIAL_RECOMMENDATION_ACTION_STATE,
  );
  const [occasion, setOccasion] = useState(defaultOccasion);
  const weather = useRecommendationWeather();
  const [styleFocus, setStyleFocus] =
    useState<RecommendationStyleFocus>(AUTO_STYLE_FOCUS);

  return (
    <form action={action} className="surface-card rounded-[1.65rem] p-4.5">
      <input type="hidden" name="targetDay" value={targetDay} />
      <input
        type="hidden"
        name="expectedWeatherLocation"
        value={weather.snapshot?.locationKey ?? ""}
      />
      <input
        type="hidden"
        name="expectedWeatherDate"
        value={weather.snapshot?.targetDate ?? ""}
      />
      <fieldset disabled={pending}>
        <legend className="text-xs font-semibold text-[var(--text-secondary)]">
          {targetDay === "tomorrow" ? "明天" : "今天"}要去哪里
        </legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {RECOMMENDATION_OCCASIONS.map((option) => (
            <label key={option.value} className="relative">
              <input
                type="radio"
                name="occasion"
                value={option.value}
                checked={option.value === occasion}
                onChange={() => {
                  setOccasion(option.value);
                  if (
                    styleFocus !== AUTO_STYLE_FOCUS &&
                    !OCCASION_STYLE_OPTIONS[option.value].includes(styleFocus)
                  ) {
                    setStyleFocus(AUTO_STYLE_FOCUS);
                  }
                }}
                className="peer sr-only"
              />
              <span className="motion-button flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-2 text-xs font-semibold text-[var(--text-secondary)] peer-checked:border-[#1d1d1f] peer-checked:bg-[#1d1d1f] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--system-blue)]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 grid gap-2 text-xs font-semibold text-[var(--text-secondary)]">
        <span className="flex items-center gap-2">
          <WandSparkles
            className="size-4 text-[var(--system-blue)]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          想要什么风格
        </span>
        <select
          name="styleFocus"
          value={styleFocus}
          disabled={pending}
          onChange={(event) =>
            setStyleFocus(event.target.value as RecommendationStyleFocus)
          }
          className="field-control min-h-12 rounded-[1rem]"
        >
          <option value={AUTO_STYLE_FOCUS}>自动搭配 · 三套尽量不同</option>
          {OCCASION_STYLE_OPTIONS[occasion].map((style) => (
            <option key={style} value={style}>
              {optionLabel(STYLE_OPTIONS, style)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending || weather.status !== "ready"}
        className="motion-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white disabled:opacity-55"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-4" strokeWidth={1.8} aria-hidden="true" />
        )}
        {pending
          ? "正在整理三套搭配…"
          : hasRecommendation
            ? `刷新${targetDay === "tomorrow" ? "明日" : "今日"}三套`
            : `生成${targetDay === "tomorrow" ? "明日" : "今日"}三套`}
      </button>

      {state.message ? (
        <output
          className={`motion-status mt-3 rounded-[1rem] px-3.5 py-3 text-xs leading-5 ${
            state.status === "error"
              ? "bg-[#ff453a]/8 text-[#b42318]"
              : "bg-[var(--system-blue-soft)] text-[var(--system-blue)]"
          }`}
        >
          {state.message}
        </output>
      ) : null}
    </form>
  );
}
