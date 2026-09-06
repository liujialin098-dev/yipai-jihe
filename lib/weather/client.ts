import type { RecommendationTargetDay } from "../recommendations/constants";
import type { WeatherLocation } from "../recommendations/location";

export type WeatherSession = {
  host: string;
  token: string;
  expiresAt: number;
  issuedAt: number;
  location: WeatherLocation | null;
  targetDay: RecommendationTargetDay;
  targetDate: string;
};
export async function getWeatherSession(
  day: RecommendationTargetDay,
  signal?: AbortSignal,
): Promise<WeatherSession> {
  const response = await fetch(`/api/weather/session?day=${day}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(12_000)])
      : AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("weather_session_unavailable");
  const session = (await response.json()) as WeatherSession;
  if (
    !/^[a-z0-9]+(?:\.[a-z0-9]+)*\.qweatherapi\.com$/.test(session.host) ||
    typeof session.token !== "string" ||
    !Number.isFinite(session.issuedAt) ||
    !Number.isFinite(session.expiresAt) ||
    session.targetDay !== day ||
    !/^\d{4}-\d{2}-\d{2}$/.test(session.targetDate) ||
    session.expiresAt - session.issuedAt > 300_000 ||
    session.expiresAt <= session.issuedAt
  )
    throw new Error("weather_invalid_session");
  return session;
}
export async function requestBrowserWeather(
  session: WeatherSession,
  path: string,
  signal?: AbortSignal,
): Promise<unknown> {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("weather_invalid_path");
  const response = await fetch(`https://${session.host}${path}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    credentials: "omit",
    redirect: "error",
    cache: "no-store",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(8_000)])
      : AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("weather_request_failed");
  return response.json();
}
