import type { RecommendationActionState } from "../../lib/recommendations/constants";

// Offline fixtures only: no real generation, weather, account or database calls.
export async function generateDailyRecommendations(
  _: RecommendationActionState,
  data: FormData,
): Promise<RecommendationActionState> {
  sessionStorage.setItem(
    "fixture-submission",
    JSON.stringify(Object.fromEntries(data)),
  );
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (location.search.includes("throw")) throw new Error("fixture offline");
  return {
    status: location.search.includes("fail") ? "error" : "success",
    message: "隔离提交完成",
  };
}
export function useRecommendationWeather() {
  return {
    status: location.search.includes("weather-error") ? "error" : "ready",
    snapshot: { locationKey: "fixture-city", targetDate: "2026-09-16" },
  };
}
