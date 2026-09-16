"use client";

import {
  BriefcaseBusiness,
  Check,
  Coffee,
  Heart,
  LoaderCircle,
  Sparkles,
  Gem,
} from "lucide-react";
import { startTransition, useActionState, useState } from "react";
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
import { RecommendationStylePicker } from "./recommendation-style-picker";

const occasionIcons = {
  commute: BriefcaseBusiness,
  casual: Coffee,
  date: Heart,
  formal: Gem,
};

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
    async (
      previous: typeof INITIAL_RECOMMENDATION_ACTION_STATE,
      data: FormData,
    ) => {
      try {
        return await generateDailyRecommendations(previous, data);
      } catch {
        return {
          status: "error" as const,
          message: "暂时无法生成，场景与风格已保留，请重试。",
        };
      }
    },
    INITIAL_RECOMMENDATION_ACTION_STATE,
  );
  const [occasion, setOccasion] = useState(defaultOccasion);
  const weather = useRecommendationWeather();
  const [styleFocus, setStyleFocus] =
    useState<RecommendationStyleFocus>(AUTO_STYLE_FOCUS);

  return (
    <form
      data-no-swipe
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || weather.status !== "ready") return;
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="surface-card recommendation-controls rounded-[1.65rem] p-4.5"
    >
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
        <div className="recommendation-occasions">
          {RECOMMENDATION_OCCASIONS.map((option) => {
            const Icon = occasionIcons[option.value];
            return (
              <label key={option.value} className="recommendation-occasion">
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
                <span className="recommendation-occasion-face">
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  <span>{option.label}</span>
                  <Check
                    className="recommendation-occasion-check"
                    size={12}
                    aria-hidden="true"
                  />
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <input type="hidden" name="styleFocus" value={styleFocus} />
      <RecommendationStylePicker
        occasion={occasion}
        value={styleFocus}
        onChange={setStyleFocus}
        disabled={pending}
      />

      <button
        type="submit"
        disabled={pending || weather.status !== "ready"}
        className="motion-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)] disabled:opacity-55"
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
              ? "bg-[var(--danger-surface)] text-[var(--danger-text)]"
              : "bg-[var(--system-blue-soft)] text-[var(--system-blue)]"
          }`}
        >
          {state.message}
        </output>
      ) : null}
    </form>
  );
}
