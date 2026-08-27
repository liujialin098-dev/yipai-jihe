import type { WeatherLocation } from "@/lib/recommendations/location";

export const IP_CITY_SUGGESTION_DISTANCE_KM = 50;

export type IpCitySuggestion = {
  city: string;
  country: "CN";
  latitude: number;
  longitude: number;
  region: string | null;
  timezone: string | null;
};

type HeaderReader = Pick<Headers, "get">;

function decodedHeader(value: string | null) {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded || null;
  } catch {
    return null;
  }
}

function coordinate(value: string | null, min: number, max: number) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

export function parseVercelIpCity(
  requestHeaders: HeaderReader,
): IpCitySuggestion | null {
  const country = requestHeaders.get("x-vercel-ip-country")?.toUpperCase();
  const city = decodedHeader(requestHeaders.get("x-vercel-ip-city"));
  const latitude = coordinate(
    requestHeaders.get("x-vercel-ip-latitude"),
    -90,
    90,
  );
  const longitude = coordinate(
    requestHeaders.get("x-vercel-ip-longitude"),
    -180,
    180,
  );
  if (
    country !== "CN" ||
    !city ||
    city.length < 2 ||
    city.length > 80 ||
    latitude === null ||
    longitude === null
  ) {
    return null;
  }

  const region = decodedHeader(
    requestHeaders.get("x-vercel-ip-country-region"),
  );
  const timezone = decodedHeader(requestHeaders.get("x-vercel-ip-timezone"));
  return {
    city,
    country: "CN",
    latitude,
    longitude,
    region: region?.slice(0, 12) ?? null,
    timezone: timezone?.slice(0, 80) ?? null,
  };
}

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function locationDistanceKm(
  first: Pick<WeatherLocation, "latitude" | "longitude">,
  second: Pick<WeatherLocation, "latitude" | "longitude">,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const boundedValue = Math.min(1, Math.max(0, value));
  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(boundedValue), Math.sqrt(1 - boundedValue))
  );
}

export function ipCitySuggestion(
  requestHeaders: HeaderReader,
  effectiveLocation: WeatherLocation | null,
) {
  const candidate = parseVercelIpCity(requestHeaders);
  if (!candidate) return null;
  if (
    effectiveLocation &&
    locationDistanceKm(candidate, effectiveLocation) <
      IP_CITY_SUGGESTION_DISTANCE_KM
  ) {
    return null;
  }
  return candidate;
}
