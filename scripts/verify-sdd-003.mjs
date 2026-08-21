import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行衣橱隔离验证。");
}

function createIsolatedClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5l4xAAAAAElFTkSuQmCC",
  "base64",
);

async function createTestSession(label) {
  const client = createIsolatedClient();
  const { data, error } = await client.auth.signInAnonymously();

  if (error || !data.user) {
    throw new Error(
      `${label} 匿名会话创建失败：${error?.message ?? "未知错误"}`,
    );
  }

  const userId = data.user.id;
  const shortId = userId.slice(0, 8).toUpperCase();
  const [profileResult, preferencesResult] = await Promise.all([
    client.from("profiles").upsert({
      display_name: `衣橱测试-${label}-${shortId}`,
      onboarding_state: "ready",
      user_id: userId,
    }),
    client.from("user_preferences").upsert({
      preferred_occasions: ["通勤"],
      preferred_styles: ["简约"],
      user_id: userId,
    }),
  ]);

  if (profileResult.error || preferencesResult.error) {
    throw new Error(
      `${label} 资料初始化失败：${profileResult.error?.message ?? preferencesResult.error?.message}`,
    );
  }

  const testKey = `sdd003-${label.toLowerCase()}-${Date.now().toString(36)}`;
  const imagePath = `${userId}/sdd-003/${testKey}.png`;
  const uploadResult = await client.storage
    .from("wardrobe-images")
    .upload(imagePath, TEST_PNG, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadResult.error) {
    throw new Error(`${label} 自身图片写入失败：${uploadResult.error.message}`);
  }

  const insertResult = await client
    .from("wardrobe_items")
    .insert({
      user_id: userId,
      demo_key: testKey,
      name: `隔离测试衣物 ${label}`,
      category: "tops",
      primary_color: label === "A" ? "blue" : "green",
      material: "cotton",
      style: "minimal",
      seasons: ["spring", "summer"],
      occasions: ["commute", "casual"],
      image_path: imagePath,
    })
    .select("id")
    .single();

  if (insertResult.error || !insertResult.data) {
    throw new Error(
      `${label} 自身衣物写入失败：${insertResult.error?.message ?? "未知错误"}`,
    );
  }

  return {
    client,
    imagePath,
    itemId: insertResult.data.id,
    shortId,
    userId,
  };
}

async function verifyOwnLifecycle(session, label) {
  const readResult = await session.client
    .from("wardrobe_items")
    .select("id, name, status")
    .eq("id", session.itemId)
    .single();
  ensure(!readResult.error, `${label} 读取自己的衣物失败`);

  const updateResult = await session.client
    .from("wardrobe_items")
    .update({ name: `隔离测试衣物 ${label} 已更新`, status: "archived" })
    .eq("id", session.itemId)
    .select("name, status")
    .single();
  ensure(!updateResult.error, `${label} 更新自己的衣物失败`);
  ensure(updateResult.data?.status === "archived", `${label} 归档状态不正确`);

  const restoreResult = await session.client
    .from("wardrobe_items")
    .update({ status: "active" })
    .eq("id", session.itemId)
    .select("status")
    .single();
  ensure(!restoreResult.error, `${label} 恢复自己的衣物失败`);
  ensure(restoreResult.data?.status === "active", `${label} 恢复状态不正确`);

  const downloadResult = await session.client.storage
    .from("wardrobe-images")
    .download(session.imagePath);
  ensure(!downloadResult.error, `${label} 下载自己的图片失败`);
}

async function verifyCrossUserBlocked(actor, target, label) {
  const readResult = await actor.client
    .from("wardrobe_items")
    .select("id")
    .eq("id", target.itemId);
  ensure(!readResult.error, `${label} 交叉读取请求异常`);
  ensure(readResult.data?.length === 0, `${label} RLS 未阻止交叉读取`);

  const updateResult = await actor.client
    .from("wardrobe_items")
    .update({ name: "不应写入" })
    .eq("id", target.itemId)
    .select("id");
  ensure(!updateResult.error, `${label} 交叉更新请求异常`);
  ensure(updateResult.data?.length === 0, `${label} RLS 未阻止交叉更新`);

  const deleteResult = await actor.client
    .from("wardrobe_items")
    .delete()
    .eq("id", target.itemId)
    .select("id");
  ensure(!deleteResult.error, `${label} 交叉删除请求异常`);
  ensure(deleteResult.data?.length === 0, `${label} RLS 未阻止交叉删除`);

  const crossDownload = await actor.client.storage
    .from("wardrobe-images")
    .download(target.imagePath);
  ensure(Boolean(crossDownload.error), `${label} Storage 未阻止交叉下载`);

  await actor.client.storage.from("wardrobe-images").remove([target.imagePath]);
  const ownerDownload = await target.client.storage
    .from("wardrobe-images")
    .download(target.imagePath);
  ensure(!ownerDownload.error, `${label} Storage 未阻止交叉删除`);
}

async function cleanup(session) {
  await session.client.from("wardrobe_items").delete().eq("id", session.itemId);
  await session.client.storage
    .from("wardrobe-images")
    .remove([session.imagePath]);
}

async function main() {
  const sessions = [];

  try {
    sessions.push(await createTestSession("A"));
    sessions.push(await createTestSession("B"));
    const [sessionA, sessionB] = sessions;

    await Promise.all([
      verifyOwnLifecycle(sessionA, "A"),
      verifyOwnLifecycle(sessionB, "B"),
    ]);
    await Promise.all([
      verifyCrossUserBlocked(sessionA, sessionB, "A 到 B"),
      verifyCrossUserBlocked(sessionB, sessionA, "B 到 A"),
    ]);

    console.log(`会话 A ${sessionA.shortId}：自身生命周期通过，无法访问会话 B`);
    console.log(`会话 B ${sessionB.shortId}：自身生命周期通过，无法访问会话 A`);
    console.log("SDD-003 衣物记录与私有原图双会话隔离验证通过");
  } finally {
    await Promise.all(sessions.map(cleanup));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "衣橱隔离验证失败");
  process.exitCode = 1;
});
