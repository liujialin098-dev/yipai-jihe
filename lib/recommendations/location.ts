export type WeatherLocation = {
  city: string;
  admin1: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type LocationResolutionFailure = "invalid" | "not_found" | "unavailable";

export class LocationResolutionError extends Error {
  constructor(public readonly code: LocationResolutionFailure) {
    super(code);
    this.name = "LocationResolutionError";
  }
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function storedWeatherLocation(input: {
  weather_admin1: unknown;
  weather_city: unknown;
  weather_latitude: unknown;
  weather_longitude: unknown;
  weather_timezone: unknown;
}): WeatherLocation | null {
  const latitude = finiteNumber(input.weather_latitude);
  const longitude = finiteNumber(input.weather_longitude);
  if (
    typeof input.weather_city !== "string" ||
    typeof input.weather_admin1 !== "string" ||
    typeof input.weather_timezone !== "string" ||
    latitude === null ||
    longitude === null
  ) {
    return null;
  }
  return {
    city: input.weather_city,
    admin1: input.weather_admin1,
    latitude,
    longitude,
    timezone: input.weather_timezone,
  };
}

export async function resolveChineseCity(
  input: string,
): Promise<WeatherLocation> {
  const city = input.trim().replace(/\s+/g, " ");
  if (city.length < 2 || city.length > 40)
    throw new LocationResolutionError("invalid");
  try {
    const { requestWeatherJson } = await import("@/lib/weather/server");
    const { parseQWeatherCity } = await import("@/lib/weather/parse");
    const query = new URLSearchParams({
      location: city,
      range: "cn",
      lang: "zh",
      number: "1",
    });
    const payload = await requestWeatherJson(`/geo/v2/city/lookup?${query}`);
    if ((payload as { code?: string })?.code === "404")
      throw new LocationResolutionError("not_found");
    return parseQWeatherCity(payload);
  } catch (error) {
    if (error instanceof LocationResolutionError) throw error;
    throw new LocationResolutionError("unavailable");
  }
}
