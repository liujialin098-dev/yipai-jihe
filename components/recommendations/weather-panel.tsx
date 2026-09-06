"use client";

import { CloudSun, RefreshCw } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  RecommendationTargetDay,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import { getWeatherSession, requestBrowserWeather } from "@/lib/weather/client";
import { parseQWeather, weatherPath } from "@/lib/weather/parse";

type WeatherState = {
  status: "loading" | "ready" | "error" | "stale" | "missing";
  snapshot: WeatherSnapshot | null;
};
const WeatherContext = createContext<WeatherState>({
  status: "loading",
  snapshot: null,
});
export const useRecommendationWeather = () => useContext(WeatherContext);

export function WeatherPanel({
  targetDay,
  targetDate,
  city,
  children,
}: {
  targetDay: RecommendationTargetDay;
  targetDate: string;
  city: string | null;
  children: ReactNode;
}) {
  const [attempt, retry] = useState(0);
  const [state, setState] = useState<WeatherState>({
    status: city ? "loading" : "missing",
    snapshot: null,
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt is an explicit user-requested reload trigger.
  useEffect(() => {
    const controller = new AbortController();
    let expiry: ReturnType<typeof setTimeout> | undefined;
    setState({ status: city ? "loading" : "missing", snapshot: null });
    if (!city) return () => controller.abort();
    async function load() {
      try {
        const session = await getWeatherSession(targetDay, controller.signal);
        const receivedAt = Date.now();
        if (
          !session.location ||
          session.location.city !== city ||
          session.targetDate !== targetDate
        )
          throw new Error("weather_location_changed");
        const payload = await requestBrowserWeather(
          session,
          weatherPath(targetDay, session.location),
          controller.signal,
        );
        const snapshot = parseQWeather(
          payload,
          targetDay,
          session.location,
          new Date(session.issuedAt),
        );
        if (controller.signal.aborted) return;
        setState({ status: "ready", snapshot });
        expiry = setTimeout(
          () => setState({ status: "stale", snapshot }),
          Math.max(
            0,
            session.expiresAt - session.issuedAt - (Date.now() - receivedAt),
          ),
        );
      } catch {
        if (!controller.signal.aborted)
          setState({ status: "error", snapshot: null });
      }
    }
    void load();
    return () => {
      controller.abort();
      clearTimeout(expiry);
    };
  }, [city, targetDate, targetDay, attempt]);
  const weather = state.snapshot;
  return (
    <WeatherContext.Provider value={state}>
      <section
        aria-label="所选城市天气"
        aria-busy={state.status === "loading"}
        className="surface-card mt-5 rounded-[1.65rem] p-4.5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="app-page-meta flex items-center gap-2">
              <CloudSun className="size-4 shrink-0" aria-hidden="true" />
              {city ?? "尚未选择城市"} ·{" "}
              {targetDay === "tomorrow" ? "明日预报" : "当前天气"}
            </p>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              {targetDate}
            </p>
          </div>
          {city ? (
            <button
              type="button"
              onClick={() => retry((value) => value + 1)}
              disabled={state.status === "loading"}
              aria-label="刷新天气"
              className="motion-button flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] disabled:opacity-50"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div aria-live="polite" className="mt-3">
          {state.status === "loading" ? (
            <p className="app-page-lead">正在获取真实天气…</p>
          ) : null}
          {state.status === "missing" ? (
            <p className="app-page-lead">先在下方选择城市，再看天气与搭配。</p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm leading-6 text-[#b42318]">
              天气暂时未取到，请检查连接后刷新。此次不会用估算天气生成搭配。
            </p>
          ) : null}
          {weather ? (
            <>
              <p className="app-section-title tabular-nums">
                {weather.temperatureC}°
                {targetDay === "tomorrow"
                  ? ` — ${weather.temperatureMaxC}°C`
                  : "C"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {targetDay === "tomorrow"
                  ? `白天${weather.daySummary} · 夜间${weather.nightSummary}`
                  : `${weather.summary} · 体感 ${weather.apparentTemperatureC}°C`}
              </p>
              {targetDay === "tomorrow" ? (
                <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                  全天最低 / 最高气温，搭配以最低气温为参考。
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">
                <a
                  href="https://www.qweather.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  和风天气
                </a>
                {" · 获取于 "}
                {new Date(weather.observedAt).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Shanghai",
                })}
                {weather.attributions?.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 underline underline-offset-2"
                  >
                    数据归因{index > 0 ? index + 1 : ""}
                  </a>
                ))}
              </p>
            </>
          ) : null}
          {state.status === "stale" ? (
            <p className="mt-2 text-xs text-[#b42318]">
              天气已超过 5 分钟，请刷新后再生成。
            </p>
          ) : null}
        </div>
      </section>
      {children}
    </WeatherContext.Provider>
  );
}
