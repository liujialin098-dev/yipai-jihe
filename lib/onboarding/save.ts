import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recalculatePreferenceScores } from "@/lib/feedback/preferences";
import { needsFirstUse, parseOnboardingChoices } from "@/lib/onboarding/model";
import type { Database, TablesUpdate } from "@/lib/supabase/database.types";

export type OnboardingResult = { ok: boolean; message: string };
export async function saveFirstUse(
  supabase: SupabaseClient<Database>,
  input: unknown,
): Promise<OnboardingResult> {
  const choices = parseOnboardingChoices(input);
  if (!choices)
    return { ok: false, message: "请检查选择，场景和风格各最多选三项。" };
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user) return { ok: false, message: "登录已失效，请重新登录。" };
  // Ignore a stale tab if the fresh user read already reports completion.
  if (!needsFirstUse(user.user_metadata)) return { ok: true, message: "" };
  const failed = {
    ok: false,
    message: "尚未完成保存，请重试。已保存的选择会保留。",
  };
  const update: TablesUpdate<"user_preferences"> = {};
  if (choices.clothing !== null) update.clothing_preference = choices.clothing;
  if (choices.occasions.length) update.preferred_occasions = choices.occasions;
  if (choices.styles.length) {
    const removed = await supabase
      .from("preference_feedback_events")
      .delete()
      .eq("user_id", user.id)
      .eq("event_type", "questionnaire")
      .like("event_key", "onboarding:style:%");
    if (removed.error) return failed;
    const events = choices.styles.map((style, index) => ({
      user_id: user.id,
      event_key: `onboarding:style:${index}`,
      event_type: "questionnaire",
      style,
      weight: 3 - index,
      metadata: { source: "onboarding" },
    }));
    const inserted = await supabase
      .from("preference_feedback_events")
      .upsert(events, { onConflict: "user_id,event_key" });
    if (inserted.error) return failed;
    if ((await recalculatePreferenceScores(supabase, user.id)).error)
      return failed;
    update.preferred_styles = choices.styles;
  }
  if (Object.keys(update).length) {
    const saved = await supabase
      .from("user_preferences")
      .update(update)
      .eq("user_id", user.id)
      .select("user_id")
      .maybeSingle();
    if (saved.error || !saved.data) return failed;
  }
  // Skip means no preference write. Mark complete only after selected fields save.
  const completed = await supabase.auth.updateUser({
    data: { ensemble_onboarding: "complete" },
  });
  if (completed.error || completed.data.user?.id !== user.id) return failed;
  return { ok: true, message: "" };
}
