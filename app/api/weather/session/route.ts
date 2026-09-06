import { createClient } from "@/lib/supabase/server";
import { createWeatherCredential } from "@/lib/weather/auth";
import { storedWeatherLocation } from "@/lib/recommendations/location";
import { getEffectiveWeatherLocation } from "@/lib/recommendations/location-context";
import { recommendationDate } from "@/lib/recommendations/date";

export const runtime = "nodejs";
const requests = new Map<string, { count: number; until: number }>();
const responseHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Origin",
};
const failure = (status: number) =>
  Response.json(
    { error: "weather_session_unavailable" },
    { status, headers: responseHeaders },
  );

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (
    request.headers.get("origin") !== url.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return failure(403);
  const day = url.searchParams.get("day") ?? "today";
  if (day !== "today" && day !== "tomorrow") return failure(400);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return failure(401);
    const now = Date.now();
    const entry = requests.get(data.user.id);
    if (entry && entry.until > now && entry.count >= 12) return failure(429);
    if (!entry || entry.until <= now) {
      for (const [key, value] of requests)
        if (value.until <= now) requests.delete(key);
      if (requests.size >= 2048) return failure(429);
      requests.set(data.user.id, { count: 1, until: now + 60_000 });
    } else entry.count++;
    const preferences = await supabase
      .from("user_preferences")
      .select(
        "weather_city, weather_admin1, weather_latitude, weather_longitude, weather_timezone",
      )
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (preferences.error) return failure(503);
    const saved = preferences.data
      ? storedWeatherLocation(preferences.data)
      : null;
    const { effectiveLocation: location } = await getEffectiveWeatherLocation(
      data.user.id,
      saved,
    );
    const issuedAt = Date.now();
    return Response.json(
      {
        ...createWeatherCredential(issuedAt),
        location,
        targetDay: day,
        targetDate: recommendationDate(
          new Date(issuedAt),
          location?.timezone ?? "Asia/Shanghai",
          day,
        ),
        issuedAt,
      },
      { headers: responseHeaders },
    );
  } catch {
    return failure(503);
  }
}
