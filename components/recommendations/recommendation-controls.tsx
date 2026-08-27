"use client";

import { CalendarDays, LoaderCircle, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { generateDailyRecommendations } from "@/app/recommendations/actions";
import {
  INITIAL_RECOMMENDATION_ACTION_STATE,
  RECOMMENDATION_OCCASIONS,
  type RecommendationOccasion,
  type RecommendationTargetDay,
} from "@/lib/recommendations/constants";

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

  return (
    <form action={action} className="surface-card rounded-[1.65rem] p-4.5">
      <input type="hidden" name="targetDay" value={targetDay} />
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
                defaultChecked={option.value === defaultOccasion}
                className="peer sr-only"
              />
              <span className="motion-button flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-2 text-xs font-semibold text-[var(--text-secondary)] peer-checked:border-[#1d1d1f] peer-checked:bg-[#1d1d1f] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--system-blue)]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center gap-2 rounded-[1.1rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3.5 py-3 text-xs leading-5 text-[var(--text-secondary)]">
        <CalendarDays
          className="size-4 shrink-0 text-[var(--system-blue)]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        仅使用当前选择城市的
        {targetDay === "tomorrow" ? "真实明日预报" : "真实当前天气"}
      </div>

      <button
        type="submit"
        disabled={pending}
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
