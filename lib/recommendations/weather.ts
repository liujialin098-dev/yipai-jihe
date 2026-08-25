import type {
  WeatherPreset,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";
import type { WeatherLocation } from "@/lib/recommendations/location";

const WEATHER_TIMEOUT_MS = 2_500;

const SIMULATED_WEATHER: Record<
  Exclude<WeatherPreset, "live">,
  Pick<
    WeatherSnapshot,
    "temperatureC" | "apparentTemperatureC" | "weatherCode" | "summary"
  >
> = {
  mild: {
    temperatureC: 22,
    apparentTemperatureC: 22,
    weatherCode: 1,
    summary: "晴间多云",
  },
  hot: {
    temperatureC: 33,
    apparentTemperatureC: 36,
    weatherCode: 0,
    summary: "晴热",
  },
  cold: {
    temperatureC: 4,
    apparentTemperatureC: 1,
    weatherCode: 3,
    summary: "阴冷",
  },
  rainy: {
    temperatureC: 18,
    apparentTemperatureC: 16,
    weatherCode: 61,
    summary: "小雨",
  },
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    weather_code?: unknown;
  };
};

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

function simulatedWeather(
  preset: Exclude<WeatherPreset, "live">,
  location?: WeatherLocation | null,
) {
  return {
    city: location?.city ?? "测试城市",
    ...SIMULATED_WEATHER[preset],
    source: "simulated" as const,
    observedAt: new Date().toISOString(),
    preset,
  } satisfies WeatherSnapshot;
}

export async function getWeatherSnapshot(
  preset: WeatherPreset,
  location?: WeatherLocation | null,
): Promise<WeatherSnapshot> {
  if (preset !== "live") return simulatedWeather(preset, location);
  if (!location) throw new Error("weather_location_required");

  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code",
    timezone: location.timezone,
    forecast_days: "1",
  });

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${query}`,
      {
        signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
        cache: "no-store",
      },
    );
    if (!response.ok) return simulatedWeather("mild", location);

    const payload = (await response.json()) as OpenMeteoResponse;
    const temperatureC = finiteNumber(payload.current?.temperature_2m);
    const apparentTemperatureC = finiteNumber(
      payload.current?.apparent_temperature,
    );
    const weatherCode = finiteNumber(payload.current?.weather_code);

    if (
      temperatureC === null ||
      apparentTemperatureC === null ||
      weatherCode === null ||
      temperatureC < -60 ||
      temperatureC > 60 ||
      apparentTemperatureC < -60 ||
      apparentTemperatureC > 60 ||
      weatherCode < 0 ||
      weatherCode > 99
    ) {
      return simulatedWeather("mild", location);
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
  } catch {
    return simulatedWeather("mild", location);
  }
}
