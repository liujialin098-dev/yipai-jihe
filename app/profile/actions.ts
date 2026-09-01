"use server";

import { revalidatePath } from "next/cache";
import {
  isOwnedProfileAvatarPath,
  normalizeDisplayName,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult =
  | { status: "success"; message: string; avatarUrl: string | null }
  | { status: "error"; message: string };

export async function updateProfile(input: {
  avatarPath?: string;
  displayName: string;
}): Promise<UpdateProfileResult> {
  const displayName = normalizeDisplayName(input.displayName);
  if (!displayName) {
    return { status: "error", message: "昵称需要填写 1 到 20 个字符。" };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { status: "error", message: "登录状态已失效，请刷新后重试。" };
  }

  if (
    input.avatarPath !== undefined &&
    !isOwnedProfileAvatarPath(input.avatarPath, user.id)
  ) {
    return { status: "error", message: "头像保存路径无效。" };
  }

  const profileResult = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileResult.error || !profileResult.data) {
    return { status: "error", message: "个人资料暂时无法读取。" };
  }

  if (input.avatarPath) {
    const fileName = input.avatarPath.split("/").at(-1) ?? "";
    const listResult = await supabase.storage
      .from("wardrobe-images")
      .list(`${user.id}/profile`, { limit: 1, search: fileName });
    if (
      listResult.error ||
      !listResult.data.some((entry) => entry.name === fileName)
    ) {
      return { status: "error", message: "新头像尚未上传完成，请重试。" };
    }
  }

  const nextAvatarPath = input.avatarPath ?? profileResult.data.avatar_path;
  const updateResult = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      ...(input.avatarPath ? { avatar_path: input.avatarPath } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("avatar_path")
    .maybeSingle();
  if (updateResult.error || !updateResult.data) {
    return { status: "error", message: "个人资料暂时无法保存。" };
  }

  const previousAvatarPath = profileResult.data.avatar_path;
  if (
    input.avatarPath &&
    previousAvatarPath &&
    previousAvatarPath !== input.avatarPath
  ) {
    await supabase.storage.from("wardrobe-images").remove([previousAvatarPath]);
  }

  const avatarResult = nextAvatarPath
    ? await supabase.storage
        .from("wardrobe-images")
        .createSignedUrl(nextAvatarPath, 60 * 30)
    : null;

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/settings");
  return {
    status: "success",
    message: "个人资料已更新。",
    avatarUrl: avatarResult?.data?.signedUrl ?? null,
  };
}
