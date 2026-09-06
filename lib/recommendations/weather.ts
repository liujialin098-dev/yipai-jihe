import type {
  RecommendationTargetDay,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import { recommendationDate } from "@/lib/recommendations/date";
import type { WeatherLocation } from "@/lib/recommendations/location";
import { parseQWeather, locationKey, weatherPath } from "@/lib/weather/parse";
import { requestWeatherJson } from "@/lib/weather/server";

export class RealWeatherUnavailableError extends Error {
  constructor() {
    super("real_weather_unavailable");
    this.name = "RealWeatherUnavailableError";
  }
}
const cache = new Map<string, { snapshot: WeatherSnapshot; until: number }>();
export async function getWeatherSnapshot(
  targetDay: RecommendationTargetDay,
  location: WeatherLocation | null,
  requestedAt = new Date(),
): Promise<WeatherSnapshot> {
  if (!location) throw new RealWeatherUnavailableError();
  try {
    const key =
      locationKey(location) +
      targetDay +
      recommendationDate(requestedAt, location.timezone, targetDay);
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) return structuredClone(hit.snapshot);
    const payload = await requestWeatherJson(weatherPath(targetDay, location));
    const snapshot = parseQWeather(payload, targetDay, location, requestedAt);
    for (const [key, entry] of cache)
      if (entry.until <= Date.now()) cache.delete(key);
    const oldest = cache.keys().next().value;
    if (cache.size >= 128 && oldest !== undefined) cache.delete(oldest);
    cache.set(key, { snapshot, until: requestedAt.getTime() + 300_000 });
    return structuredClone(snapshot);
  } catch {
    throw new RealWeatherUnavailableError();
  }
}
