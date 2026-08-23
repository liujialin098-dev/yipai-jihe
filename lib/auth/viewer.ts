import { cache } from "react";
import { maskEmail } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  displayName: string;
  email: string | null;
  emailMasked: string | null;
  isAnonymous: boolean;
  onboardingState: string;
  passwordConfigured: boolean;
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

    if (claimsError || !userId) return null;

    const claims = claimsData.claims as typeof claimsData.claims & {
      email?: string;
      user_metadata?: { account_password_configured?: boolean };
    };
    const email = typeof claims.email === "string" ? claims.email : null;
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
      email,
      emailMasked: maskEmail(email),
      isAnonymous: claimsData.claims.is_anonymous === true,
      onboardingState: profileResult.data.onboarding_state,
      passwordConfigured:
        claims.user_metadata?.account_password_configured === true,
      preferredOccasions: preferencesResult.data.preferred_occasions,
      preferredStyles: preferencesResult.data.preferred_styles,
      shortId: userId.slice(0, 8).toUpperCase(),
      userId,
    };
  } catch {
    return null;
  }
});
