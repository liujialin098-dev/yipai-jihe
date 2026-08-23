"use server";

import { revalidatePath } from "next/cache";
import {
  isWardrobeStyle,
  recalculatePreferenceScores,
  type PreferenceEventType,
} from "@/lib/feedback/preferences";
import type { Json } from "@/lib/supabase/database.types";
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
  const focus = requestedFocus in FOCUS_STYLES ? requestedFocus : "versatile";
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
  const preferenceResult = await supabase
    .from("user_preferences")
    .update({
      preference_state: intent === "skip" ? "skipped" : "completed",
      preference_focus: focus,
      preferred_occasions: occasions,
    })
    .eq("user_id", user.id);
  if (preferenceResult.error) {
    return { status: "error", message: "偏好暂时无法保存。" };
  }
  await recalculatePreferenceScores(supabase, user.id);
  revalidatePath("/settings");
  revalidatePath("/settings/preferences");
  revalidatePath("/recommendations");
  return {
    status: "success",
    message: intent === "skip" ? "已使用默认偏好。" : "偏好已更新。",
  };
}
