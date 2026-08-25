import type {
  RecommendationTargetDay,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import { recommendationDate } from "@/lib/recommendations/data";
import type { WeatherLocation } from "@/lib/recommendations/location";

const WEATHER_TIMEOUT_MS = 4_000;

export class RealWeatherUnavailableError extends Error {
  constructor() {
    super("real_weather_unavailable");
    this.name = "RealWeatherUnavailableError";
  }
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    weather_code?: unknown;
  };
  daily?: {
    time?: unknown;
    temperature_2m_min?: unknown;
    apparent_temperature_min?: unknown;
    weather_code?: unknown;
  };
};

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function arrayNumber(value: unknown, index: number) {
  return Array.isArray(value) ? finiteNumber(value[index]) : null;
}

function weatherSummary(code: number) {
  if (code === 0) return "晴";
  if (code <= 2) return "晴间多云";
  if (code === 3) return "阴";
  if (code === 45 || code === 48) return "有雾";
  if (code >= 51 && code <= 67) return "有雨";
  if (code >= 71 && code <= 77) return "有雪";
  if (code >= 80 && code <= 82) return "阵雨";
  if (code >= 85 && code <= 86) return "阵雪";
  if (code >= 95) return "雷雨";
  return "天气多变";
}

function validWeatherValues(
  temperatureC: number | null,
  apparentTemperatureC: number | null,
  weatherCode: number | null,
): temperatureC is number {
  return Boolean(
    temperatureC !== null &&
      apparentTemperatureC !== null &&
      weatherCode !== null &&
      temperatureC >= -60 &&
      temperatureC <= 60 &&
      apparentTemperatureC >= -60 &&
      apparentTemperatureC <= 60 &&
      weatherCode >= 0 &&
      weatherCode <= 99,
  );
}

export async function getWeatherSnapshot(
  targetDay: RecommendationTargetDay,
  location: WeatherLocation | null,
  requestedAt = new Date(),
): Promise<WeatherSnapshot> {
  if (!location) throw new RealWeatherUnavailableError();

  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max",
    timezone: location.timezone,
    forecast_days: "2",
  });

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${query}`,
      {
        signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new RealWeatherUnavailableError();

    const payload = (await response.json()) as OpenMeteoResponse;
    let temperatureC = finiteNumber(payload.current?.temperature_2m);
    let apparentTemperatureC = finiteNumber(
      payload.current?.apparent_temperature,
    );
    let weatherCode = finiteNumber(payload.current?.weather_code);

    if (targetDay === "tomorrow") {
      const targetDate = recommendationDate(
        requestedAt,
        location.timezone,
        "tomorrow",
      );
      const forecastDates = Array.isArray(payload.daily?.time)
        ? payload.daily.time
        : [];
      const forecastIndex = forecastDates.indexOf(targetDate);
      if (forecastIndex < 0) throw new RealWeatherUnavailableError();

      temperatureC = arrayNumber(
        payload.daily?.temperature_2m_min,
        forecastIndex,
      );
      apparentTemperatureC = arrayNumber(
        payload.daily?.apparent_temperature_min,
        forecastIndex,
      );
      weatherCode = arrayNumber(payload.daily?.weather_code, forecastIndex);
    }

    if (
      !validWeatherValues(temperatureC, apparentTemperatureC, weatherCode) ||
      apparentTemperatureC === null ||
      weatherCode === null
    ) {
      throw new RealWeatherUnavailableError();
    }

    return {
      city: location.city,
      temperatureC: Math.round(temperatureC),
      apparentTemperatureC: Math.round(apparentTemperatureC),
      weatherCode: Math.round(weatherCode),
      summary: weatherSummary(Math.round(weatherCode)),
      source: "live",
      observedAt: new Date().toISOString(),
      preset: "live",
    };
  } catch (error) {
    if (error instanceof RealWeatherUnavailableError) throw error;
    throw new RealWeatherUnavailableError();
  }
}
