"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { professionalSourcePath } from "@/lib/outfits/professional-cutout";
import { createClient } from "@/lib/supabase/server";
import {
  type ActionState,
  isUuid,
  validateWardrobeItemForm,
} from "@/lib/wardrobe/validation";

async function getActionContext() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || !userId) return null;
    return { supabase, userId };
  } catch {
    return null;
  }
}

function revalidateWardrobe(itemId?: string) {
  revalidatePath("/");
  revalidatePath("/wardrobe");
  if (itemId) {
    revalidatePath(`/wardrobe/${itemId}`);
    revalidatePath(`/wardrobe/${itemId}/edit`);
  }
}

export async function loadDemoWardrobe(
  _previousState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  // Keep old callers harmless: demo import is retired for every identity.
  return { status: "error", message: "演示衣橱已停用，请添加自己的衣物。" };
}

export async function updateWardrobeItem(
  itemId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isUuid(itemId)) {
    return { status: "error", message: "未找到该衣物。" };
  }

  const validation = validateWardrobeItemForm(formData);
  if (!validation.success) {
    return {
      status: "error",
      message: "请修正标出的内容后再保存。",
      fieldErrors: validation.fieldErrors,
    };
  }

  const context = await getActionContext();
  if (!context) {
    return { status: "error", message: "会话已失效，请刷新后重试。" };
  }

  const { data, error } = await context.supabase
    .from("wardrobe_items")
    .update(validation.data)
    .eq("id", itemId)
    .eq("user_id", context.userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "未找到该衣物，或保存暂时失败。" };
  }

  revalidateWardrobe(itemId);
  redirect(`/wardrobe/${itemId}`);
}

async function setWardrobeItemStatus(
  itemId: string,
  status: "active" | "archived",
): Promise<ActionState> {
  if (!isUuid(itemId)) {
    return { status: "error", message: "未找到该衣物。" };
  }

  const context = await getActionContext();
  if (!context) {
    return { status: "error", message: "会话已失效，请刷新后重试。" };
  }

  const { data, error } = await context.supabase
    .from("wardrobe_items")
    .update({ status })
    .eq("id", itemId)
    .eq("user_id", context.userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "未找到该衣物，或操作暂时失败。" };
  }

  revalidateWardrobe(itemId);
  return {
    status: "success",
    message: status === "archived" ? "已移入归档。" : "已恢复到日常衣橱。",
  };
}

export async function archiveWardrobeItem(
  itemId: string,
  _previousState: ActionState,
  _formData: FormData,
) {
  return setWardrobeItemStatus(itemId, "archived");
}

export async function restoreWardrobeItem(
  itemId: string,
  _previousState: ActionState,
  _formData: FormData,
) {
  return setWardrobeItemStatus(itemId, "active");
}

export async function deleteWardrobeItem(
  itemId: string,
  _previousState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  if (!isUuid(itemId)) {
    return { status: "error", message: "未找到该衣物。" };
  }

  const context = await getActionContext();
  if (!context) {
    return { status: "error", message: "会话已失效，请刷新后重试。" };
  }

  const { data: item, error: readError } = await context.supabase
    .from("wardrobe_items")
    .select("id, image_path, cutout_path")
    .eq("id", itemId)
    .eq("user_id", context.userId)
    .maybeSingle();

  if (readError || !item) {
    return { status: "error", message: "未找到该衣物。" };
  }

  const { error: storageError } = await context.supabase.storage
    .from("wardrobe-images")
    .remove([
      item.image_path,
      ...(item.cutout_path
        ? [item.cutout_path, professionalSourcePath(item.cutout_path)]
        : []),
    ]);

  if (storageError) {
    return {
      status: "error",
      message: "原图暂时无法移除，衣物仍然保留，请稍后重试。",
    };
  }

  const { data: deleted, error: deleteError } = await context.supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", context.userId)
    .select("id")
    .maybeSingle();

  if (deleteError || !deleted) {
    return {
      status: "error",
      message: "原图已移除，但记录清理未完成，请再次执行删除。",
    };
  }

  revalidateWardrobe(itemId);
  redirect("/wardrobe");
}
