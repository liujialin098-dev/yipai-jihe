import type { RecommendationTargetDay } from "./constants";

export function recommendationDate(
  date = new Date(),
  timeZone = "Asia/Shanghai",
  targetDay: RecommendationTargetDay = "today",
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return new Date(
    Date.UTC(
      Number(value.year),
      Number(value.month) - 1,
      Number(value.day) + (targetDay === "tomorrow" ? 1 : 0),
    ),
  )
    .toISOString()
    .slice(0, 10);
}
