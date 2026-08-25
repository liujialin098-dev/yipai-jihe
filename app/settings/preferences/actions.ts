"use server";

import { revalidatePath } from "next/cache";
import {
  isWardrobeStyle,
  recalculatePreferenceScores,
  type PreferenceEventType,
} from "@/lib/feedback/preferences";
import {
  isClothingPreference,
  type ClothingPreference,
} from "@/lib/personalization/constants";
import {
  LocationResolutionError,
  resolveChineseCity,
} from "@/lib/recommendations/location";
import type { Json, TablesUpdate } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  OCCASION_OPTIONS,
  isOptionValue,
  type Occasion,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

export type PreferenceFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const FOCUS_STYLES: Record<string, WardrobeStyle> = {
  comfort: "casual",
  versatile: "minimal",
  refined: "elegant",
};

export async function savePreferenceQuestionnaire(
  _state: PreferenceFormState,
  formData: FormData,
): Promise<PreferenceFormState> {
  const intent = formData.get("intent") === "skip" ? "skip" : "save";
  const requestedStyles = formData
    .getAll("styles")
    .map(String)
    .filter(isWardrobeStyle);
  const requestedOccasions = formData
    .getAll("occasions")
    .map(String)
    .filter((value): value is Occasion =>
      isOptionValue(OCCASION_OPTIONS, value),
    );
  const requestedFocus = String(formData.get("focus") ?? "versatile");
  const requestedClothingPreference = String(
    formData.get("clothingPreference") ?? "unrestricted",
  );
  const cityInput = String(formData.get("city") ?? "").trim();
  const focus = requestedFocus in FOCUS_STYLES ? requestedFocus : "versatile";
  const clothingPreference: ClothingPreference = isClothingPreference(
    requestedClothingPreference,
  )
    ? requestedClothingPreference
    : "unrestricted";
  const styles =
    intent === "skip" ? ["minimal", "casual", "commute"] : requestedStyles;
  const occasions =
    intent === "skip" ? ["casual", "commute"] : requestedOccasions;
  if (
    styles.length < 1 ||
    styles.length > 3 ||
    occasions.length < 1 ||
    occasions.length > 3
  ) {
    return { status: "error", message: "风格和场合各选 1～3 项。" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userError ? null : userData.user;
  if (!user) return { status: "error", message: "体验会话已失效。" };

  let location: Awaited<ReturnType<typeof resolveChineseCity>> | null = null;
  if (cityInput) {
    try {
      location = await resolveChineseCity(cityInput);
    } catch (error) {
      if (error instanceof LocationResolutionError) {
        if (error.code === "invalid") {
          return { status: "error", message: "请输入完整城市名，例如武汉。" };
        }
        if (error.code === "not_found") {
          return {
            status: "error",
            message: "没有找到这个中国城市，请检查名称后重试。",
          };
        }
      }
      return { status: "error", message: "城市暂时无法确认，请稍后重试。" };
    }
  }

  await supabase
    .from("preference_feedback_events")
    .delete()
    .eq("user_id", user.id)
    .eq("event_type", "questionnaire" satisfies PreferenceEventType);

  const events = styles.map((style, index) => ({
    user_id: user.id,
    event_key: `questionnaire:style:${index}:${style}`,
    event_type: "questionnaire",
    style,
    weight: 3 - index,
    metadata: { source: "style_rank" } as Json,
  }));
  events.push({
    user_id: user.id,
    event_key: `questionnaire:focus:${focus}`,
    event_type: "questionnaire",
    style: FOCUS_STYLES[focus],
    weight: 1,
    metadata: { source: "focus", focus } as Json,
  });
  const insertResult = await supabase
    .from("preference_feedback_events")
    .insert(events);
  if (insertResult.error) {
    return { status: "error", message: "偏好暂时无法保存。" };
  }
  const preferenceUpdate: TablesUpdate<"user_preferences"> = {
    clothing_preference: clothingPreference,
    preference_state: intent === "skip" ? "skipped" : "completed",
    preference_focus: focus,
    preferred_occasions: occasions,
    updated_at: new Date().toISOString(),
  };
  if (location) {
    preferenceUpdate.weather_city = location.city;
    preferenceUpdate.weather_admin1 = location.admin1;
    preferenceUpdate.weather_latitude = location.latitude;
    preferenceUpdate.weather_longitude = location.longitude;
    preferenceUpdate.weather_timezone = location.timezone;
  }

  const preferenceResult = await supabase
    .from("user_preferences")
    .update(preferenceUpdate)
    .eq("user_id", user.id);
  if (preferenceResult.error) {
    return { status: "error", message: "偏好暂时无法保存。" };
  }
  await recalculatePreferenceScores(supabase, user.id);
  await supabase.from("daily_recommendations").delete().eq("user_id", user.id);
  revalidatePath("/settings");
  revalidatePath("/settings/preferences");
  revalidatePath("/recommendations");
  return {
    status: "success",
    message: location
      ? `已保存${location.city}和衣着偏好。`
      : intent === "skip"
        ? "已使用默认偏好。"
        : "偏好已更新。",
  };
}
