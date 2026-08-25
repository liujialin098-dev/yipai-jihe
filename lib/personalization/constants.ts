export const CLOTHING_PREFERENCE_OPTIONS = [
  { value: "male", label: "男装" },
  { value: "female", label: "女装" },
  { value: "unrestricted", label: "不限" },
] as const;

export const WARDROBE_AUDIENCE_OPTIONS = [
  { value: "male", label: "男装" },
  { value: "female", label: "女装" },
  { value: "unisex", label: "中性" },
] as const;

export type ClothingPreference =
  (typeof CLOTHING_PREFERENCE_OPTIONS)[number]["value"];
export type WardrobeAudience =
  (typeof WARDROBE_AUDIENCE_OPTIONS)[number]["value"];

export function isClothingPreference(
  value: string,
): value is ClothingPreference {
  return CLOTHING_PREFERENCE_OPTIONS.some((option) => option.value === value);
}

export function isWardrobeAudience(value: string): value is WardrobeAudience {
  return WARDROBE_AUDIENCE_OPTIONS.some((option) => option.value === value);
}

export function clothingPreferenceLabel(value: string) {
  return (
    CLOTHING_PREFERENCE_OPTIONS.find((option) => option.value === value)
      ?.label ?? "不限"
  );
}

export function wardrobeAudienceLabel(value: string) {
  return (
    WARDROBE_AUDIENCE_OPTIONS.find((option) => option.value === value)?.label ??
    "中性"
  );
}

export function allowedWardrobeAudiences(
  preference: ClothingPreference,
): WardrobeAudience[] {
  if (preference === "male") return ["male", "unisex"];
  if (preference === "female") return ["female", "unisex"];
  return ["male", "female", "unisex"];
}

export function matchesClothingPreference(
  audience: string,
  preference: ClothingPreference,
) {
  return allowedWardrobeAudiences(preference).includes(
    isWardrobeAudience(audience) ? audience : "unisex",
  );
}
