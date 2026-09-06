import { cache } from "react";
import { maskEmail } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  avatarUrl: string | null;
  clothingPreference: string;
  displayName: string;
  email: string | null;
  emailMasked: string | null;
  fashionPersonalized: boolean;
  fashionTopics: string[];
  fashionUnreadEnabled: boolean;
  isAnonymous: boolean;
  onboardingState: string;
  passwordConfigured: boolean;
  preferredOccasions: string[];
  preferredStyles: string[];
  shortId: string;
  userId: string;
  weatherAdmin1: string | null;
  weatherCity: string | null;
  weatherLatitude: number | null;
  weatherLongitude: number | null;
  weatherTimezone: string | null;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  try {
    const supabase = await createClient();
    // Account attributes can change while the current JWT still contains the
    // previous anonymous claim. getUser() returns the fresh Auth server record.
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;

    if (userError || !user) return null;

    const userId = user.id;
    const email = typeof user.email === "string" ? user.email : null;
    const [profileResult, preferencesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("avatar_path, display_name, onboarding_state")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select(
          "preferred_styles, preferred_occasions, clothing_preference, weather_city, weather_admin1, weather_latitude, weather_longitude, weather_timezone, fashion_topics, fashion_personalized, fashion_unread_enabled",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (
      profileResult.error ||
      preferencesResult.error ||
      !profileResult.data ||
      !preferencesResult.data
    ) {
      return null;
    }

    const avatarResult = profileResult.data.avatar_path
      ? await supabase.storage
          .from("wardrobe-images")
          .createSignedUrl(profileResult.data.avatar_path, 60 * 30)
      : null;

    return {
      avatarUrl: avatarResult?.data?.signedUrl ?? null,
      clothingPreference: preferencesResult.data.clothing_preference,
      displayName: profileResult.data.display_name,
      email,
      emailMasked: maskEmail(email),
      fashionPersonalized: preferencesResult.data.fashion_personalized,
      fashionTopics: preferencesResult.data.fashion_topics,
      fashionUnreadEnabled: preferencesResult.data.fashion_unread_enabled,
      isAnonymous: user.is_anonymous === true,
      onboardingState: profileResult.data.onboarding_state,
      passwordConfigured:
        user.user_metadata?.account_password_configured === true,
      preferredOccasions: preferencesResult.data.preferred_occasions,
      preferredStyles: preferencesResult.data.preferred_styles,
      shortId: userId.slice(0, 8).toUpperCase(),
      userId,
      weatherAdmin1: preferencesResult.data.weather_admin1,
      weatherCity: preferencesResult.data.weather_city,
      weatherLatitude: preferencesResult.data.weather_latitude,
      weatherLongitude: preferencesResult.data.weather_longitude,
      weatherTimezone: preferencesResult.data.weather_timezone,
    };
  } catch {
    return null;
  }
});
