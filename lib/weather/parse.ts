import type {
  RecommendationTargetDay,
  WeatherSnapshot,
} from "../recommendations/constants";
import { recommendationDate } from "@/lib/recommendations/date";
import type { WeatherLocation } from "../recommendations/location";

export class WeatherDataError extends Error {
  constructor() {
    super("weather_data_unavailable");
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new WeatherDataError();
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 40): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new WeatherDataError();
  return value.trim();
}
function temperature(value: unknown): number {
  const item = record(value);
  if (
    item.unit !== "°C" ||
    typeof item.value !== "number" ||
    !Number.isFinite(item.value) ||
    item.value < -60 ||
    item.value > 60
  )
    throw new WeatherDataError();
  return Math.round(item.value);
}

// Coarse WMO compatibility classes for existing garment rules, not a provider observation.
const WEATHER_CODES: Record<string, number> = {
  "100": 0,
  "101": 2,
  "102": 1,
  "103": 2,
  "104": 3,
  "300": 80,
  "301": 82,
  "302": 95,
  "303": 95,
  "304": 99,
  "305": 61,
  "306": 63,
  "307": 65,
  "308": 65,
  "309": 51,
  "310": 65,
  "311": 65,
  "312": 65,
  "313": 67,
  "314": 63,
  "315": 65,
  "316": 65,
  "317": 65,
  "318": 65,
  "399": 61,
  "400": 71,
  "401": 73,
  "402": 75,
  "403": 75,
  "404": 77,
  "405": 77,
  "406": 85,
  "407": 85,
  "408": 73,
  "409": 75,
  "410": 75,
  "499": 71,
  "500": 45,
  "501": 45,
  "502": 5,
  "503": 7,
  "504": 6,
  "507": 9,
  "508": 9,
  "509": 45,
  "510": 45,
  "511": 5,
  "512": 5,
  "513": 5,
  "514": 45,
  "515": 45,
};
export function qweatherCodeToWmo(code: unknown): number {
  if (typeof code !== "string" || !Object.hasOwn(WEATHER_CODES, code))
    throw new WeatherDataError();
  return WEATHER_CODES[code];
}
function condition(value: unknown) {
  const item = record(value);
  return {
    code: text(item.code, 3),
    summary: text(item.text, 20),
    wmo: qweatherCodeToWmo(item.code),
  };
}
const rainy = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
const snowy = (code: number) =>
  (code >= 71 && code <= 77) || (code >= 85 && code <= 86);

export function locationKey(location: WeatherLocation): string {
  return JSON.stringify([
    location.city,
    location.admin1,
    location.latitude.toFixed(2),
    location.longitude.toFixed(2),
    location.timezone,
  ]);
}
export function weatherPath(
  day: RecommendationTargetDay,
  location: WeatherLocation,
) {
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.latitude) > 90 ||
    Math.abs(location.longitude) > 180
  )
    throw new WeatherDataError();
  return `/weather/v1/${day === "today" ? "current" : "daily"}/${location.latitude.toFixed(2)}/${location.longitude.toFixed(2)}?lang=zh&localTime=true${day === "tomorrow" ? "&days=3" : ""}`;
}
export function safeAttributions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((item): item is string => {
        if (typeof item !== "string" || item.length > 300) return false;
        try {
          const url = new URL(item);
          return (
            url.protocol === "https:" &&
            !url.username &&
            !url.password &&
            (url.hostname === "qweather.com" ||
              url.hostname.endsWith(".qweather.com"))
          );
        } catch {
          return false;
        }
      }),
    ),
  ].slice(0, 8);
}

export function parseQWeather(
  payload: unknown,
  day: RecommendationTargetDay,
  location: WeatherLocation,
  now = new Date(),
): WeatherSnapshot {
  const input = record(payload);
  const targetDate = recommendationDate(now, location.timezone, day);
  let selected = condition(
    day === "today"
      ? input.condition
      : findDay(input.days, targetDate, location.timezone).daytimeCondition,
  );
  let temperatureC: number;
  let apparentTemperatureC: number;
  let temperatureMaxC: number | undefined;
  let nightSummary: string | undefined;
  if (day === "today") {
    temperatureC = temperature(input.temperature);
    apparentTemperatureC = temperature(input.feelsLike);
  } else {
    const forecast = findDay(input.days, targetDate, location.timezone);
    temperatureC = temperature(forecast.day.temperatureMin);
    temperatureMaxC = temperature(forecast.day.temperatureMax);
    if (temperatureMaxC < temperatureC) throw new WeatherDataError();
    apparentTemperatureC = temperatureC; // Legacy rule input; explicitly labelled air_minimum.
    const night = condition(record(forecast.day.nighttime).condition);
    nightSummary = night.summary;
    // A snow period remains snow; otherwise rain in either period informs waterproof rules.
    if (snowy(night.wmo) || (!snowy(selected.wmo) && rainy(night.wmo)))
      selected = night;
  }
  return {
    city: text(location.city),
    temperatureC,
    apparentTemperatureC,
    weatherCode: selected.wmo,
    summary: selected.summary,
    source: "live",
    observedAt: now.toISOString(),
    preset: "live",
    provider: "qweather",
    targetDate,
    temperatureBasis: day === "today" ? "feels_like" : "air_minimum",
    temperatureMaxC,
    providerCode: selected.code,
    nightSummary,
    daySummary:
      day === "tomorrow"
        ? condition(
            findDay(input.days, targetDate, location.timezone).daytimeCondition,
          ).summary
        : undefined,
    attributions: safeAttributions(
      input.metadata ? record(input.metadata).attributions : [],
    ),
    locationKey: locationKey(location),
  };
}
function findDay(value: unknown, targetDate: string, timezone: string) {
  if (!Array.isArray(value)) throw new WeatherDataError();
  const day = value.map(record).find((candidate) => {
    if (typeof candidate.forecastStartTime !== "string") return false;
    const start = new Date(candidate.forecastStartTime);
    return (
      Number.isFinite(start.getTime()) &&
      recommendationDate(start, timezone) === targetDate
    );
  });
  if (!day) throw new WeatherDataError();
  return { day, daytimeCondition: record(day.daytime).condition };
}

export function parseQWeatherCity(payload: unknown): WeatherLocation {
  const input = record(payload);
  if (
    input.code !== "200" ||
    !Array.isArray(input.location) ||
    !input.location.length
  )
    throw new WeatherDataError();
  const city = record(input.location[0]);
  if (city.country !== "中国") throw new WeatherDataError();
  const latitude = Number(text(city.lat, 20));
  const longitude = Number(text(city.lon, 20));
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw new WeatherDataError();
  const timezone = text(city.tz, 80);
  recommendationDate(new Date(), timezone);
  return {
    city: text(city.name),
    admin1: text(city.adm1),
    latitude,
    longitude,
    timezone,
  };
}
