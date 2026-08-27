import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行 SDD-016 验证。");
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

async function verifySourceBoundaries() {
  const projectRoot = new URL("../", import.meta.url);
  const [
    homeSource,
    shellSource,
    bootstrapSource,
    gatewaySource,
    loginSource,
    actionSource,
  ] = await Promise.all([
    readFile(new URL("app/page.tsx", projectRoot), "utf8"),
    readFile(new URL("components/app-shell.tsx", projectRoot), "utf8"),
    readFile(new URL("components/session-bootstrap.tsx", projectRoot), "utf8"),
    readFile(
      new URL("components/auth/auth-entry-gateway.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("components/auth/login-form.tsx", projectRoot), "utf8"),
    readFile(new URL("lib/auth/actions.ts", projectRoot), "utf8"),
  ]);

  ensure(
    homeSource.includes("if (!viewer)") &&
      homeSource.includes("<AuthEntryGateway"),
    "首页没有在业务数据前完成账号入口分流",
  );
  ensure(
    shellSource.includes("viewer ? <StatusHeader") &&
      shellSource.includes("viewer ? <BottomNavigation"),
    "无会话入口仍会显示应用状态栏或底部导航",
  );
  ensure(
    !bootstrapSource.includes("/api/session/anonymous") &&
      bootstrapSource.includes('router.replace("/")'),
    "仍存在自动匿名创建，或无会话深链接没有返回入口",
  );
  ensure(gatewaySource.includes("登录"), "统一入口缺少“登录”");
  ensure(gatewaySource.includes("注册"), "统一入口缺少“注册”");
  ensure(loginSource.includes("使用体验身份进入"), "统一入口缺少体验身份入口");
  ensure(
    actionSource.includes("supabase.auth.signUp") &&
      actionSource.includes("!signUpData.session") &&
      !actionSource.includes("resetPasswordForEmail"),
    "直接注册没有以有效会话为成功门禁，或仍会发送密码邮件",
  );
}

async function initializeUser(client, userId) {
  const [profileResult, preferencesResult] = await Promise.all([
    client.from("profiles").upsert({ user_id: userId }),
    client.from("user_preferences").upsert({ user_id: userId }),
  ]);
  ensure(
    !profileResult.error,
    `测试资料创建失败：${profileResult.error?.message}`,
  );
  ensure(
    !preferencesResult.error,
    `测试偏好创建失败：${preferencesResult.error?.message}`,
  );
}

async function verifyLiveAuth() {
  const accountClient = createIsolatedClient();
  const email = `sdd016-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = `Sdd016!${randomBytes(12).toString("base64url")}`;
  const signUp = await accountClient.auth.signUp({
    email,
    password,
    options: { data: { account_password_configured: true } },
  });

  ensure(!signUp.error, `直接注册失败：${signUp.error?.message}`);
  ensure(signUp.data.user, "直接注册没有返回用户");
  ensure(
    signUp.data.session,
    "直接注册没有立即返回会话：请确认 Supabase 已关闭 Confirm email",
  );
  ensure(
    signUp.data.user.is_anonymous === false,
    "邮箱密码注册意外创建了匿名身份",
  );

  const accountUserId = signUp.data.user.id;
  await initializeUser(accountClient, accountUserId);
  ensure(
    !(await accountClient.auth.signOut({ scope: "local" })).error,
    "退出失败",
  );

  const signIn = await accountClient.auth.signInWithPassword({
    email,
    password,
  });
  ensure(!signIn.error, `注册后重新登录失败：${signIn.error?.message}`);
  ensure(signIn.data.user.id === accountUserId, "重新登录没有恢复同一账号");

  const experienceClient = createIsolatedClient();
  const experience = await experienceClient.auth.signInAnonymously();
  ensure(!experience.error && experience.data.user, "体验身份创建失败");
  const experienceUserId = experience.data.user.id;
  await initializeUser(experienceClient, experienceUserId);

  const crossRead = await experienceClient
    .from("profiles")
    .select("user_id")
    .eq("user_id", accountUserId);
  ensure(!crossRead.error, `跨用户读取检查失败：${crossRead.error?.message}`);
  ensure(crossRead.data.length === 0, "体验身份读取到了注册账号资料");

  await Promise.all([
    accountClient.auth.signOut({ scope: "local" }),
    experienceClient.auth.signOut({ scope: "local" }),
  ]);

  console.log(
    `注册账号 ${accountUserId.slice(0, 8).toUpperCase()}：无需邮件确认即建立会话并可重新登录`,
  );
  console.log(
    `体验身份 ${experienceUserId.slice(0, 8).toUpperCase()}：只在显式调用后创建，跨用户读取被拒绝`,
  );
}

async function main() {
  await verifySourceBoundaries();
  await verifyLiveAuth();
  console.log("统一入口、禁止自动匿名、直接注册、重登录与身份隔离检查通过");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "SDD-016 验证失败");
  process.exitCode = 1;
});
