"use client";

import { ChevronDown, LoaderCircle, MapPin } from "lucide-react";
import { useActionState, useState } from "react";
import {
  saveWeatherCity,
  type WeatherCityActionState,
} from "@/app/recommendations/actions";

const INITIAL_STATE: WeatherCityActionState = {
  status: "idle",
  message: "",
};

export function WeatherCitySelector({
  currentCity,
}: {
  currentCity: string | null;
}) {
  const [expanded, setExpanded] = useState(!currentCity);
  const [state, action, pending] = useActionState(
    saveWeatherCity,
    INITIAL_STATE,
  );
  const shownCity = state.city ?? currentCity;

  return (
    <section className="surface-card bubble-enter mt-4 overflow-hidden rounded-[1.45rem]">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
            <MapPin className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-tertiary)]">天气城市</p>
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {shownCity ?? "尚未选择"}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="weather-city-panel"
          onClick={() => setExpanded((current) => !current)}
          className="motion-button inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-3.5 text-xs font-semibold text-[var(--foreground)]"
        >
          选择城市
          <ChevronDown
            className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <p className="border-t border-[var(--hairline)] px-4 py-3 text-xs leading-5 text-[var(--text-tertiary)]">
        使用账号保存城市，不按 IP 自动切换。出差时可在这里修改。
      </p>

      {expanded ? (
        <form
          id="weather-city-panel"
          action={action}
          className="grid gap-3 border-t border-[var(--hairline)] bg-[var(--surface-soft)] p-4"
        >
          <label htmlFor="weather-city-input" className="text-xs font-semibold">
            请输入城市名
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              key={shownCity ?? "empty"}
              id="weather-city-input"
              name="city"
              defaultValue={shownCity ?? ""}
              maxLength={40}
              placeholder="例如上海"
              autoComplete="address-level2"
              className="field-control min-w-0 rounded-full bg-[var(--surface-solid)] px-4 text-sm"
            />
            <button
              type="submit"
              disabled={pending}
              className="motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white disabled:opacity-55"
            >
              {pending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {pending ? "确认中" : "确认"}
            </button>
          </div>
          {state.message ? (
            <output
              aria-live="polite"
              className={`rounded-[1rem] px-3.5 py-3 text-xs leading-5 ${
                state.status === "error"
                  ? "bg-[#ff453a]/8 text-[#b42318]"
                  : "bg-[var(--system-blue-soft)] text-[var(--system-blue)]"
              }`}
            >
              {state.message}
            </output>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
