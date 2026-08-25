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

type GeocodingResult = {
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
  country_code?: unknown;
  admin1?: unknown;
};

type GeocodingResponse = { results?: GeocodingResult[] };

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
  if (city.length < 2 || city.length > 40) {
    throw new LocationResolutionError("invalid");
  }

  const query = new URLSearchParams({
    name: city,
    count: "5",
    language: "zh",
    countryCode: "CN",
    format: "json",
  });

  let response: Response;
  try {
    response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${query}`,
      { cache: "no-store", signal: AbortSignal.timeout(3_500) },
    );
  } catch {
    throw new LocationResolutionError("unavailable");
  }
  if (!response.ok) throw new LocationResolutionError("unavailable");

  const payload = (await response.json()) as GeocodingResponse;
  const match = (payload.results ?? []).find(
    (result) => result.country_code === "CN",
  );
  const latitude = finiteNumber(match?.latitude);
  const longitude = finiteNumber(match?.longitude);
  if (
    !match ||
    typeof match.name !== "string" ||
    typeof match.timezone !== "string" ||
    latitude === null ||
    longitude === null
  ) {
    throw new LocationResolutionError("not_found");
  }

  return {
    city: match.name.slice(0, 80),
    admin1:
      typeof match.admin1 === "string" && match.admin1.trim()
        ? match.admin1.trim().slice(0, 80)
        : "中国",
    latitude,
    longitude,
    timezone: match.timezone.slice(0, 80),
  };
}
