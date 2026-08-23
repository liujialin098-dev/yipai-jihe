import type {
  WeatherPreset,
  WeatherSnapshot,
} from "@/lib/recommendations/constants";

const DEFAULT_CITY = "北京";
const DEFAULT_LATITUDE = 39.9042;
const DEFAULT_LONGITUDE = 116.4074;
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

function configuredCoordinate(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
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

function simulatedWeather(preset: Exclude<WeatherPreset, "live">) {
  return {
    city: process.env.WEATHER_CITY_NAME?.trim() || DEFAULT_CITY,
    ...SIMULATED_WEATHER[preset],
    source: "simulated" as const,
    observedAt: new Date().toISOString(),
    preset,
  } satisfies WeatherSnapshot;
}

export async function getWeatherSnapshot(
  preset: WeatherPreset,
): Promise<WeatherSnapshot> {
  if (preset !== "live") return simulatedWeather(preset);

  const city = process.env.WEATHER_CITY_NAME?.trim() || DEFAULT_CITY;
  const latitude = configuredCoordinate("WEATHER_LATITUDE", DEFAULT_LATITUDE);
  const longitude = configuredCoordinate(
    "WEATHER_LONGITUDE",
    DEFAULT_LONGITUDE,
  );
  const timezone = process.env.WEATHER_TIMEZONE?.trim() || "Asia/Shanghai";
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,weather_code",
    timezone,
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
    if (!response.ok) return simulatedWeather("mild");

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
      return simulatedWeather("mild");
    }

    return {
      city,
      temperatureC: Math.round(temperatureC),
      apparentTemperatureC: Math.round(apparentTemperatureC),
      weatherCode: Math.round(weatherCode),
      summary: weatherSummary(Math.round(weatherCode)),
      source: "live",
      observedAt: new Date().toISOString(),
      preset: "live",
    };
  } catch {
    return simulatedWeather("mild");
  }
}
