"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { DEMO_WARDROBE } from "@/lib/wardrobe/catalog";
import { createDemoPng } from "@/lib/wardrobe/demo-image";
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
  const context = await getActionContext();
  if (!context) {
    return {
      status: "error",
      message: "匿名会话还没有准备好，请稍后重试。",
    };
  }

  const { supabase, userId } = context;
  const { data: existingItems, error: existingError } = await supabase
    .from("wardrobe_items")
    .select("demo_key")
    .eq("user_id", userId)
    .not("demo_key", "is", null);

  if (existingError) {
    return { status: "error", message: "无法检查演示衣橱，请稍后重试。" };
  }

  const existingKeys = new Set(
    (existingItems ?? []).flatMap((item) =>
      item.demo_key ? [item.demo_key] : [],
    ),
  );
  const missingItems = DEMO_WARDROBE.filter(
    (item) => !existingKeys.has(item.demoKey),
  );

  if (missingItems.length === 0) {
    return {
      status: "success",
      message: "28 件演示衣物已经齐全，没有产生重复数据。",
    };
  }

  const uploadResults = await Promise.allSettled(
    missingItems.map(async (item) => {
      const imagePath = `${userId}/demo/${item.demoKey}.png`;
      const { error } = await supabase.storage
        .from("wardrobe-images")
        .upload(imagePath, createDemoPng(item), {
          cacheControl: "3600",
          contentType: "image/png",
          upsert: true,
        });

      if (error) throw new Error("upload_failed");
      return { item, imagePath };
    }),
  );

  const uploaded = uploadResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (uploaded.length > 0) {
    const rows: TablesInsert<"wardrobe_items">[] = uploaded.map(
      ({ imagePath, item }) => ({
        user_id: userId,
        audience: item.audience,
        demo_key: item.demoKey,
        name: item.name,
        category: item.category,
        primary_color: item.primaryColor,
        material: item.material,
        style: item.style,
        seasons: item.seasons,
        occasions: item.occasions,
        image_path: imagePath,
      }),
    );

    const { error: insertError } = await supabase
      .from("wardrobe_items")
      .upsert(rows, {
        onConflict: "user_id,demo_key",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return {
        status: "error",
        message: "图片已经准备好，但衣物记录未能写入，请重试补齐。",
      };
    }
  }

  const { count } = await supabase
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("demo_key", "is", null);

  if ((count ?? 0) > 0) {
    await supabase
      .from("profiles")
      .update({ onboarding_state: "ready" })
      .eq("user_id", userId);
  }

  revalidateWardrobe();

  if ((count ?? 0) === DEMO_WARDROBE.length) {
    return {
      status: "success",
      message: `演示衣橱已就绪，本次补齐 ${uploaded.length} 件。`,
    };
  }

  return {
    status: "error",
    message: `目前已有 ${count ?? 0} 件，部分图片未完成，请再次加载补齐。`,
  };
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
    .select("id, image_path")
    .eq("id", itemId)
    .eq("user_id", context.userId)
    .maybeSingle();

  if (readError || !item) {
    return { status: "error", message: "未找到该衣物。" };
  }

  const { error: storageError } = await context.supabase.storage
    .from("wardrobe-images")
    .remove([item.image_path]);

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
