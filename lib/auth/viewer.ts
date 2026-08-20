import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  displayName: string;
  isAnonymous: boolean;
  onboardingState: string;
  preferredOccasions: string[];
  preferredStyles: string[];
  shortId: string;
  userId: string;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return null;
    }

    const [profileResult, preferencesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, onboarding_state")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select("preferred_styles, preferred_occasions")
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

    return {
      displayName: profileResult.data.display_name,
      isAnonymous: claimsData.claims.is_anonymous === true,
      onboardingState: profileResult.data.onboarding_state,
      preferredOccasions: preferencesResult.data.preferred_occasions,
      preferredStyles: preferencesResult.data.preferred_styles,
      shortId: userId.slice(0, 8).toUpperCase(),
      userId,
    };
  } catch {
    return null;
  }
});
