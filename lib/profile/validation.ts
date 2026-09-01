const AVATAR_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export type ProfileAvatarMime = keyof typeof AVATAR_MIME_TO_EXTENSION;

export function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") return null;
  const withoutControls = Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint > 31 && codePoint !== 127;
    })
    .join("");
  const normalized = withoutControls.replace(/\s+/g, " ").trim();
  const length = Array.from(normalized).length;
  return length >= 1 && length <= 20 ? normalized : null;
}

export function avatarExtensionForMime(value: unknown) {
  return typeof value === "string" && value in AVATAR_MIME_TO_EXTENSION
    ? AVATAR_MIME_TO_EXTENSION[value as ProfileAvatarMime]
    : null;
}

export function validateProfileAvatarFile(file: File) {
  const extension = avatarExtensionForMime(file.type);
  if (!extension) {
    return {
      success: false as const,
      message: "请选择 JPG、PNG 或 WebP 图片。",
    };
  }
  if (file.size <= 0 || file.size > PROFILE_AVATAR_MAX_BYTES) {
    return { success: false as const, message: "头像大小不能超过 5MB。" };
  }
  return { success: true as const, extension };
}

export function profileAvatarPath(
  userId: string,
  uploadId: string,
  extension: string,
) {
  return `${userId}/profile/avatar-${uploadId}.${extension}`;
}

export function isOwnedProfileAvatarPath(value: unknown, userId: string) {
  return (
    typeof value === "string" &&
    new RegExp(
      `^${userId}/profile/avatar-[0-9a-f-]{36}\\.(jpg|png|webp)$`,
    ).test(value)
  );
}

export function displayNameInitial(displayName: string) {
  return Array.from(displayName.trim())[0]?.toLocaleUpperCase("zh-CN") ?? "衣";
}
