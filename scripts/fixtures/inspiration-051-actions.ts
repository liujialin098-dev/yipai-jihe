import {
  normalizeFashionTopics,
  type FashionActionState,
} from "../../lib/inspiration/validation";

// 隔离持久化假体：不访问真实账号、数据库或供应商。
export async function saveFashionPreferences(
  _state: FashionActionState,
  data: FormData,
) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const topics = normalizeFashionTopics(data.getAll("topics"));
  if (!topics) return { ok: false, message: "请至少选择一个主题" };
  if (new URLSearchParams(location.search).has("fail"))
    return { ok: false, message: "偏好尚未保存，请稍后重试。" };
  localStorage.setItem(
    "fixture-051",
    JSON.stringify({
      topics,
      personalized: data.get("personalized") === "on",
      unreadEnabled: data.get("unreadEnabled") === "on",
    }),
  );
  return { ok: true, message: "内容偏好已保存" };
}
