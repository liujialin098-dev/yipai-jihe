"use client";

import {
  ChevronDown,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { useActionState, useState } from "react";
import {
  restoreSavedWeatherCity,
  saveWeatherCity,
  type WeatherCityActionState,
} from "@/app/recommendations/actions";

const INITIAL_STATE: WeatherCityActionState = {
  status: "idle",
  message: "",
};

function ResultMessage({ state }: { state: WeatherCityActionState }) {
  if (!state.message) return null;
  return (
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
  );
}

export function WeatherCitySelector({
  currentCity,
  savedCity,
  ipSuggestion,
  usingSessionOverride,
}: {
  currentCity: string | null;
  savedCity: string | null;
  ipSuggestion: { city: string } | null;
  usingSessionOverride: boolean;
}) {
  const [expanded, setExpanded] = useState(!currentCity);
  const [manualState, manualAction, manualPending] = useActionState(
    saveWeatherCity,
    INITIAL_STATE,
  );
  const [suggestionState, suggestionAction, suggestionPending] = useActionState(
    saveWeatherCity,
    INITIAL_STATE,
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreSavedWeatherCity,
    INITIAL_STATE,
  );

  return (
    <section className="surface-card bubble-enter mt-4 overflow-hidden rounded-[1.45rem]">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
            <MapPin className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-tertiary)]">
              {usingSessionOverride ? "本次使用 · 天气城市" : "常用天气城市"}
            </p>
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {currentCity ?? "尚未选择"}
            </p>
            {usingSessionOverride ? (
              <p className="mt-0.5 truncate text-[0.6875rem] text-[var(--text-tertiary)]">
                账号常用城市：{savedCity ?? "尚未设置"}
              </p>
            ) : null}
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

      {usingSessionOverride ? (
        <form
          action={restoreAction}
          className="grid gap-3 border-t border-[var(--hairline)] px-4 py-3"
        >
          <button
            type="submit"
            disabled={restorePending}
            className="motion-button inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-4 text-xs font-semibold text-[var(--foreground)] disabled:opacity-55"
          >
            {restorePending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RotateCcw
                className="size-4"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
            {savedCity ? `恢复${savedCity}` : "清除本次城市"}
          </button>
          <ResultMessage state={restoreState} />
        </form>
      ) : null}

      {ipSuggestion ? (
        <div className="grid gap-3 border-t border-[var(--hairline)] bg-[var(--system-blue-soft)] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[var(--system-blue)]">
              <LocateFixed
                className="size-4"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                检测到你可能在 {ipSuggestion.city}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                IP 定位可能受 VPN、运营商或网络出口影响，切换前由你确认。
              </p>
            </div>
          </div>
          <form action={suggestionAction} className="grid grid-cols-2 gap-2">
            <input type="hidden" name="city" value={ipSuggestion.city} />
            <button
              type="submit"
              name="mode"
              value="session"
              disabled={suggestionPending}
              className="motion-button inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-white/72 px-3 text-xs font-semibold text-[var(--foreground)] disabled:opacity-55"
            >
              本次使用
            </button>
            <button
              type="submit"
              name="mode"
              value="saved"
              disabled={suggestionPending}
              className="motion-button inline-flex min-h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-3 text-xs font-semibold text-white disabled:opacity-55"
            >
              {suggestionPending ? "确认中" : "设为常用城市"}
            </button>
          </form>
          <ResultMessage state={suggestionState} />
        </div>
      ) : null}

      <p className="border-t border-[var(--hairline)] px-4 py-3 text-xs leading-5 text-[var(--text-tertiary)]">
        IP 只提供待确认建议，不按 IP 自动切换或覆盖。你也可以手动修改常用城市。
      </p>

      {expanded ? (
        <form
          id="weather-city-panel"
          action={manualAction}
          className="grid gap-3 border-t border-[var(--hairline)] bg-[var(--surface-soft)] p-4"
        >
          <input type="hidden" name="mode" value="saved" />
          <label htmlFor="weather-city-input" className="text-xs font-semibold">
            请输入城市名
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              key={savedCity ?? currentCity ?? "empty"}
              id="weather-city-input"
              name="city"
              defaultValue={savedCity ?? currentCity ?? ""}
              maxLength={40}
              placeholder="例如上海"
              autoComplete="address-level2"
              className="field-control min-w-0 rounded-full bg-[var(--surface-solid)] px-4 text-sm"
            />
            <button
              type="submit"
              disabled={manualPending}
              className="motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white disabled:opacity-55"
            >
              {manualPending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {manualPending ? "确认中" : "保存"}
            </button>
          </div>
          <ResultMessage state={manualState} />
        </form>
      ) : null}
    </section>
  );
}
