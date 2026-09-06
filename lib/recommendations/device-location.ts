export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

export type DeviceLocationFailure =
  | "invalid"
  | "not_found"
  | "outside_china"
  | "unavailable";

export class DeviceLocationError extends Error {
  readonly code: DeviceLocationFailure;

  constructor(code: DeviceLocationFailure) {
    super(code);
    this.code = code;
    this.name = "DeviceLocationError";
  }
}

type ReverseGeocodeResponse = {
  city?: unknown;
  countryCode?: unknown;
  locality?: unknown;
  lookupSource?: unknown;
};

function finiteCoordinate(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

function cleanCity(value: unknown) {
  if (typeof value !== "string") return null;
  const city = value.trim().replace(/\s+/g, " ");
  return city.length >= 2 && city.length <= 80 ? city : null;
}

export function parseDeviceCoordinates(input: {
  latitude: unknown;
  longitude: unknown;
}): DeviceCoordinates {
  const latitude = finiteCoordinate(input.latitude, -90, 90);
  const longitude = finiteCoordinate(input.longitude, -180, 180);
  if (latitude === null || longitude === null) {
    throw new DeviceLocationError("invalid");
  }
  return { latitude, longitude };
}

export function parseDeviceChineseCity(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new DeviceLocationError("not_found");
  }
  const response = payload as ReverseGeocodeResponse;
  const countryCode = cleanCity(response.countryCode)?.toUpperCase();
  if (countryCode !== "CN") {
    throw new DeviceLocationError("outside_china");
  }
  if (response.lookupSource !== "coordinates") {
    throw new DeviceLocationError("not_found");
  }
  const city = cleanCity(response.city) ?? cleanCity(response.locality);
  if (!city) throw new DeviceLocationError("not_found");
  return city;
}

export async function reverseGeocodeDeviceCity(input: {
  latitude: unknown;
  longitude: unknown;
}) {
  const coordinates = parseDeviceCoordinates(input);
  try {
    const { getWeatherSession, requestBrowserWeather } = await import(
      "@/lib/weather/client"
    );
    const { parseQWeatherCity } = await import("@/lib/weather/parse");
    const session = await getWeatherSession("today");
    // Device coordinates go only to QWeather, never to the application server.
    const query = new URLSearchParams({
      location: `${coordinates.longitude.toFixed(2)},${coordinates.latitude.toFixed(2)}`,
      lang: "zh",
      number: "1",
    });
    const payload = await requestBrowserWeather(
      session,
      `/geo/v2/city/lookup?${query}`,
    );
    const country = (payload as { location?: { country?: string }[] })
      ?.location?.[0]?.country;
    if (country && country !== "中国")
      throw new DeviceLocationError("outside_china");
    return parseQWeatherCity(payload).city;
  } catch (error) {
    if (error instanceof DeviceLocationError) throw error;
    throw new DeviceLocationError("unavailable");
  }
}
