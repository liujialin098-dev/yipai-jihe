import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { STYLE_OPTIONS, type WardrobeStyle } from "@/lib/wardrobe/constants";

export const FEEDBACK_WEIGHTS = {
  favoriteItem: 1,
  favoriteOutfit: 0.5,
  replacement: 0.35,
} as const;

export type PreferenceEventType =
  | "questionnaire"
  | "view"
  | "replace"
  | "favorite_item"
  | "unfavorite_item"
  | "favorite_outfit"
  | "unfavorite_outfit";

export function isWardrobeStyle(value: string): value is WardrobeStyle {
  return STYLE_OPTIONS.some((option) => option.value === value);
}

export async function recalculatePreferenceScores(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("preference_feedback_events")
    .select("style, weight")
    .eq("user_id", userId)
    .not("style", "is", null);
  if (error) return { error };

  const scores = Object.fromEntries(
    STYLE_OPTIONS.map((option) => [option.value, 0]),
  ) as Record<WardrobeStyle, number>;
  for (const event of data ?? []) {
    if (event.style && isWardrobeStyle(event.style)) {
      scores[event.style] = Math.max(
        0,
        Number((scores[event.style] + Number(event.weight)).toFixed(2)),
      );
    }
  }

  const preferredStyles = [...STYLE_OPTIONS]
    .sort(
      (a, b) =>
        scores[b.value] - scores[a.value] ||
        STYLE_OPTIONS.findIndex((item) => item.value === a.value) -
          STYLE_OPTIONS.findIndex((item) => item.value === b.value),
    )
    .slice(0, 3)
    .map((option) => option.value);

  const updateResult = await supabase
    .from("user_preferences")
    .update({
      preferred_styles: preferredStyles,
      style_scores: scores as unknown as Json,
    })
    .eq("user_id", userId);
  return { error: updateResult.error, scores, preferredStyles };
}

export async function addFeedbackEvent(
  supabase: SupabaseClient<Database>,
  event: {
    userId: string;
    eventKey: string;
    eventType: PreferenceEventType;
    style?: WardrobeStyle | null;
    weight?: number;
    recommendationId?: string | null;
    outfitSlot?: number | null;
    wardrobeItemId?: string | null;
    metadata?: Json;
  },
) {
  return supabase.from("preference_feedback_events").upsert(
    {
      user_id: event.userId,
      event_key: event.eventKey,
      event_type: event.eventType,
      style: event.style ?? null,
      weight: event.weight ?? 0,
      recommendation_id: event.recommendationId ?? null,
      outfit_slot: event.outfitSlot ?? null,
      wardrobe_item_id: event.wardrobeItemId ?? null,
      metadata: event.metadata ?? {},
    },
    { onConflict: "user_id,event_key", ignoreDuplicates: true },
  );
}
