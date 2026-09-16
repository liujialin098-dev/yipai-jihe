import {
  type ClothingPreference,
  isClothingPreference,
} from "@/lib/personalization/constants";
import { type SkinId, skins } from "@/lib/ui/skins";
import {
  isOptionValue,
  isWardrobeStyle,
  OCCASION_OPTIONS,
  type Occasion,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

// Presentation state only. Never use user-editable metadata for authorization.
export const FIRST_USE_METADATA = { ensemble_onboarding: "pending" } as const;
export function needsFirstUse(metadata: Record<string, unknown> | undefined) {
  return metadata?.ensemble_onboarding === "pending";
}
export type OnboardingChoices = {
  clothing: ClothingPreference | null;
  skin: SkinId | null;
  occasions: Occasion[];
  styles: WardrobeStyle[];
};
export const EMPTY_CHOICES: OnboardingChoices = {
  clothing: null,
  skin: null,
  occasions: [],
  styles: [],
};
export function parseOnboardingChoices(
  input: unknown,
): OnboardingChoices | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (
    value.clothing !== null &&
    (typeof value.clothing !== "string" ||
      !isClothingPreference(value.clothing))
  )
    return null;
  if (value.skin !== null && !skins.some((skin) => skin.id === value.skin))
    return null;
  if (
    !Array.isArray(value.occasions) ||
    value.occasions.length > 3 ||
    !value.occasions.every(
      (v): v is Occasion =>
        typeof v === "string" && isOptionValue(OCCASION_OPTIONS, v),
    )
  )
    return null;
  if (
    !Array.isArray(value.styles) ||
    value.styles.length > 3 ||
    !value.styles.every(
      (v): v is WardrobeStyle => typeof v === "string" && isWardrobeStyle(v),
    )
  )
    return null;
  return {
    clothing: value.clothing as ClothingPreference | null,
    skin: value.skin as SkinId | null,
    occasions: [...new Set(value.occasions)],
    styles: [...new Set(value.styles)],
  };
}
