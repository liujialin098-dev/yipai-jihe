import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行账号恢复验证。");
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
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

async function main() {
  const projectRoot = new URL("../", import.meta.url);
  const [homeSource, actionSource, loginSource, cssSource, packageSource] =
    await Promise.all([
      readFile(new URL("app/page.tsx", projectRoot), "utf8"),
      readFile(new URL("lib/auth/actions.ts", projectRoot), "utf8"),
      readFile(new URL("components/auth/login-form.tsx", projectRoot), "utf8"),
      readFile(new URL("app/globals.css", projectRoot), "utf8"),
      readFile(new URL("package.json", projectRoot), "utf8"),
    ]);
  ensure(homeSource.includes('href="/settings#account"'), "主页缺少注册入口");
  ensure(homeSource.includes('href="/login"'), "主页缺少登录入口");
  ensure(
    actionSource.includes("registerCurrentAccount") &&
      actionSource.includes("email,") &&
      actionSource.includes("password,"),
    "注册动作没有一次提交邮箱和密码",
  );
  ensure(
    !actionSource.includes("resetPasswordForEmail"),
    "登录流程仍会发送密码设置邮件",
  );
  ensure(
    !loginSource.includes("PasswordSetupLinkForm"),
    "登录页仍展示邮件密码设置入口",
  );
  ensure(
    cssSource.includes(".field-control-with-icon"),
    "图标输入框缺少独立左侧留白",
  );
  ensure(
    packageSource.includes("account:set-password-local"),
    "缺少本地一次性密码设置命令",
  );

  const client = createIsolatedClient();
  const { data: anonymousData, error: anonymousError } =
    await client.auth.signInAnonymously();
  if (anonymousError || !anonymousData.user) {
    throw new Error(`匿名测试身份创建失败：${anonymousError?.message}`);
  }

  const userId = anonymousData.user.id;
  const marker = `sdd-002-${Date.now()}`;
  const profileResult = await client.from("profiles").upsert({
    display_name: marker,
    user_id: userId,
  });
  ensure(
    !profileResult.error,
    `测试资料创建失败：${profileResult.error?.message}`,
  );

  const metadataResult = await client.auth.updateUser({
    data: { sdd_002_identity_marker: marker },
  });
  ensure(!metadataResult.error, "匿名身份原地更新失败");
  ensure(metadataResult.data.user.id === userId, "账号更新意外改变了用户 ID");

  const ownProfile = await client
    .from("profiles")
    .select("user_id, display_name")
    .eq("user_id", userId)
    .single();
  ensure(!ownProfile.error, "账号更新后无法读取原资料");
  ensure(ownProfile.data.user_id === userId, "原资料用户归属发生变化");
  ensure(ownProfile.data.display_name === marker, "原资料内容发生变化");

  const signOutResult = await client.auth.signOut({ scope: "local" });
  ensure(!signOutResult.error, "本地退出失败");
  const sessionResult = await client.auth.getSession();
  ensure(!sessionResult.data.session, "退出后仍残留会话");

  const invalidLogin = await client.auth.signInWithPassword({
    email: "sdd-002-invalid@example.invalid",
    password: "not-a-real-password",
  });
  ensure(Boolean(invalidLogin.error), "无效邮箱密码不应登录成功");

  console.log(
    `测试身份 ${userId.slice(0, 8).toUpperCase()}：原地更新后用户 ID 与资料保持不变`,
  );
  console.log("本地退出清除会话、无效凭据拒绝验证通过");
  console.log("主页入口、无邮件注册边界、本地恢复命令和输入框留白检查通过");
  console.log("真实邮箱注册与跨设备恢复需按 quickstart 在 Preview 完成");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "SDD-002 验证失败");
  process.exitCode = 1;
});
