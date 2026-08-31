const DEVICE_CITY_ENDPOINT =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

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
  const query = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    localityLanguage: "zh",
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch(`${DEVICE_CITY_ENDPOINT}?${query}`, {
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    throw new DeviceLocationError("unavailable");
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) throw new DeviceLocationError("unavailable");
  try {
    return parseDeviceChineseCity(await response.json());
  } catch (error) {
    if (error instanceof DeviceLocationError) throw error;
    throw new DeviceLocationError("unavailable");
  }
}
