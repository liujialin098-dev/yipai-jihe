"use server";

import { revalidatePath } from "next/cache";
import { getTrustedFashionContent } from "@/lib/inspiration/content";
import {
  isFashionContentId,
  normalizeFashionTopics,
  type FashionActionState,
} from "@/lib/inspiration/validation";
import { createClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}

export async function setFashionContentRead(
  contentId: string,
  read: boolean,
  _previous: FashionActionState,
  _formData: FormData,
): Promise<FashionActionState> {
  if (!isFashionContentId(contentId) || typeof read !== "boolean")
    return { ok: false, message: "内容无效，请刷新后重试。" };
  const context = await currentUser();
  if (!context) return { ok: false, message: "登录状态已失效，请重新进入。" };
  const validIds = new Set(
    (await getTrustedFashionContent(new Date(), false)).map((item) => item.id),
  );
  if (!validIds.has(contentId))
    return { ok: false, message: "内容已过期，请刷新列表。" };

  if (read) {
    const result = await context.supabase.from("fashion_content_reads").upsert(
      {
        user_id: context.userId,
        content_id: contentId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,content_id" },
    );
    if (result.error) return { ok: false, message: "阅读状态未保存，请重试。" };
  } else {
    const result = await context.supabase
      .from("fashion_content_reads")
      .delete()
      .eq("user_id", context.userId)
      .eq("content_id", contentId);
    if (result.error) return { ok: false, message: "阅读状态未保存，请重试。" };
  }
  revalidatePath("/", "layout");
  revalidatePath("/inspiration");
  return { ok: true, message: read ? "已标记为已读" : "已设为未读" };
}

export async function saveFashionPreferences(
  _previous: FashionActionState,
  formData: FormData,
): Promise<FashionActionState> {
  const topics = normalizeFashionTopics(formData.getAll("topics"));
  if (!topics)
    return {
      ok: false,
      message: "请至少选择一个主题；如不想接收提示，可以关闭未读提示。",
    };
  const context = await currentUser();
  if (!context) return { ok: false, message: "登录状态已失效，请重新进入。" };
  const result = await context.supabase
    .from("user_preferences")
    .update({
      fashion_topics: topics,
      fashion_personalized: formData.get("personalized") === "on",
      fashion_unread_enabled: formData.get("unreadEnabled") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", context.userId)
    .select("user_id")
    .single();
  if (result.error) return { ok: false, message: "偏好尚未保存，请稍后重试。" };
  revalidatePath("/", "layout");
  revalidatePath("/inspiration");
  return { ok: true, message: "内容偏好已保存" };
}

export async function recordFashionImpression(contentId: string) {
  if (!isFashionContentId(contentId)) return;
  const context = await currentUser();
  if (!context) return;
  const item = (await getTrustedFashionContent(new Date(), false)).find(
    (entry) => entry.id === contentId,
  );
  if (!item) return;
  const { error } = await context.supabase.rpc("record_fashion_impression", {
    p_topic_key: item.topicFingerprint,
    p_content_id: item.id,
  });
  if (error) throw new Error("内容提示记录未保存");
}
