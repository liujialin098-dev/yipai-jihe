import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行隔离验证。");
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

async function createTestSession(label) {
  const client = createIsolatedClient();
  const { data, error } = await client.auth.signInAnonymously();

  if (error || !data.user) {
    throw new Error(
      `${label} 匿名会话创建失败：${error?.message ?? "未知错误"}`,
    );
  }

  const shortId = data.user.id.slice(0, 8).toUpperCase();
  const displayName = `隔离测试-${label}-${shortId}`;
  const [profileResult, preferencesResult] = await Promise.all([
    client.from("profiles").upsert({
      display_name: displayName,
      user_id: data.user.id,
    }),
    client.from("user_preferences").upsert({
      preferred_occasions: ["隔离验证"],
      preferred_styles: [label],
      user_id: data.user.id,
    }),
  ]);

  if (profileResult.error || preferencesResult.error) {
    throw new Error(
      `${label} 测试数据初始化失败：${profileResult.error?.message ?? preferencesResult.error?.message}`,
    );
  }

  return { client, displayName, shortId, userId: data.user.id };
}

async function verifyOwnData(session) {
  const [profileResult, preferencesResult] = await Promise.all([
    session.client
      .from("profiles")
      .select("user_id, display_name")
      .eq("user_id", session.userId)
      .single(),
    session.client
      .from("user_preferences")
      .select("user_id, preferred_styles")
      .eq("user_id", session.userId)
      .single(),
  ]);

  ensure(!profileResult.error, "读取自己的资料失败");
  ensure(!preferencesResult.error, "读取自己的偏好失败");
  ensure(
    profileResult.data?.display_name === session.displayName,
    "自己的资料内容不一致",
  );
  ensure(
    preferencesResult.data?.user_id === session.userId,
    "自己的偏好归属不一致",
  );
}

async function verifyCrossUserBlocked(actor, target) {
  const readResult = await actor.client
    .from("profiles")
    .select("user_id")
    .eq("user_id", target.userId);

  ensure(!readResult.error, "交叉读取请求异常");
  ensure(readResult.data?.length === 0, "RLS 未阻止交叉读取");

  const updateResult = await actor.client
    .from("profiles")
    .update({ display_name: "不应写入" })
    .eq("user_id", target.userId)
    .select("user_id");

  ensure(!updateResult.error, "交叉更新请求异常");
  ensure(updateResult.data?.length === 0, "RLS 未阻止交叉更新");

  const foreignPath = `${target.userId}/sdd-001/forbidden-${actor.shortId}.txt`;
  const foreignUpload = await actor.client.storage
    .from("wardrobe-images")
    .upload(foreignPath, new Blob(["blocked"]), { contentType: "text/plain" });

  ensure(Boolean(foreignUpload.error), "Storage 未阻止跨用户路径写入");
}

async function verifyOwnStorage(session) {
  const objectPath = `${session.userId}/sdd-001/allowed-${Date.now()}.txt`;
  const uploadResult = await session.client.storage
    .from("wardrobe-images")
    .upload(objectPath, new Blob(["sdd-001"]), { contentType: "text/plain" });

  ensure(
    !uploadResult.error,
    `自己的 Storage 写入失败：${uploadResult.error?.message}`,
  );

  const removeResult = await session.client.storage
    .from("wardrobe-images")
    .remove([objectPath]);

  ensure(!removeResult.error, "测试对象清理失败");
}

async function main() {
  const [sessionA, sessionB] = await Promise.all([
    createTestSession("A"),
    createTestSession("B"),
  ]);

  await Promise.all([verifyOwnData(sessionA), verifyOwnData(sessionB)]);
  await Promise.all([
    verifyCrossUserBlocked(sessionA, sessionB),
    verifyCrossUserBlocked(sessionB, sessionA),
  ]);
  await Promise.all([verifyOwnStorage(sessionA), verifyOwnStorage(sessionB)]);

  console.log(`会话 A ${sessionA.shortId}：自身访问通过，交叉访问被阻止`);
  console.log(`会话 B ${sessionB.shortId}：自身访问通过，交叉访问被阻止`);
  console.log("SDD-001 匿名数据与 Storage 路径隔离验证通过");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "隔离验证失败");
  process.exitCode = 1;
});
