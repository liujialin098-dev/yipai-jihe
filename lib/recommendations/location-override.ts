import type { WeatherLocation } from "@/lib/recommendations/location";

const COOKIE_VERSION = 1;

type WeatherLocationOverride = {
  location: WeatherLocation;
  userId: string;
  version: 1;
};

function validText(value: unknown) {
  return typeof value === "string" && value.length >= 1 && value.length <= 80;
}

function validCoordinate(value: unknown, min: number, max: number) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function isWeatherLocation(value: unknown): value is WeatherLocation {
  if (!value || typeof value !== "object") return false;
  const location = value as Record<string, unknown>;
  return (
    validText(location.city) &&
    validText(location.admin1) &&
    validText(location.timezone) &&
    validCoordinate(location.latitude, -90, 90) &&
    validCoordinate(location.longitude, -180, 180)
  );
}

export function encodeWeatherLocationOverride(
  userId: string,
  location: WeatherLocation,
) {
  const payload: WeatherLocationOverride = {
    version: COOKIE_VERSION,
    userId,
    location,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function parseWeatherLocationOverride(
  value: string | undefined,
  userId: string,
): WeatherLocation | null {
  if (!value || value.length > 1200) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<WeatherLocationOverride>;
    if (
      payload.version !== COOKIE_VERSION ||
      payload.userId !== userId ||
      !isWeatherLocation(payload.location)
    ) {
      return null;
    }
    return payload.location;
  } catch {
    return null;
  }
}
