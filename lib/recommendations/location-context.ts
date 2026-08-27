import { cookies, headers } from "next/headers";
import {
  ipCitySuggestion,
  type IpCitySuggestion,
} from "@/lib/recommendations/ip-location";
import type { WeatherLocation } from "@/lib/recommendations/location";
import {
  encodeWeatherLocationOverride,
  parseWeatherLocationOverride,
} from "@/lib/recommendations/location-override";

const WEATHER_LOCATION_COOKIE = "weather-location-override";

export type WeatherLocationContext = {
  effectiveLocation: WeatherLocation | null;
  ipSuggestion: IpCitySuggestion | null;
  overrideActive: boolean;
  savedLocation: WeatherLocation | null;
};

export async function getEffectiveWeatherLocation(
  userId: string,
  savedLocation: WeatherLocation | null,
) {
  const cookieStore = await cookies();
  const override = parseWeatherLocationOverride(
    cookieStore.get(WEATHER_LOCATION_COOKIE)?.value,
    userId,
  );
  return {
    effectiveLocation: override ?? savedLocation,
    overrideActive: Boolean(override),
  };
}

export async function getWeatherLocationContext(
  userId: string,
  savedLocation: WeatherLocation | null,
): Promise<WeatherLocationContext> {
  const [{ effectiveLocation, overrideActive }, requestHeaders] =
    await Promise.all([
      getEffectiveWeatherLocation(userId, savedLocation),
      headers(),
    ]);
  return {
    savedLocation,
    effectiveLocation,
    overrideActive,
    ipSuggestion: ipCitySuggestion(requestHeaders, effectiveLocation),
  };
}

export async function setWeatherLocationOverride(
  userId: string,
  location: WeatherLocation,
) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: WEATHER_LOCATION_COOKIE,
    value: encodeWeatherLocationOverride(userId, location),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "medium",
  });
}

export async function clearWeatherLocationOverride() {
  (await cookies()).delete(WEATHER_LOCATION_COOKIE);
}
