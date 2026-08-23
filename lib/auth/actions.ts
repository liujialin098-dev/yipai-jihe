"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  type AuthActionState,
  mapAuthError,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

function errorState(
  message: string,
  fieldErrors?: AuthActionState["fieldErrors"],
): AuthActionState {
  return { fieldErrors, message, status: "error" };
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin;

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function requestEmailBinding(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  if (!validateEmail(email)) {
    return errorState("请填写可以接收验证邮件的邮箱。", {
      email: "邮箱格式不正确。",
    });
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return errorState("匿名身份已失效，请刷新页面重新开始。", {
      email: "当前没有可绑定的匿名身份。",
    });
  }
  if (!data.user.is_anonymous) {
    redirect("/settings?binding=verified");
  }

  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/confirm?next=/settings` },
  );

  if (error) {
    return errorState(
      mapAuthError(error, "验证邮件暂时没有发出，请稍后重试。"),
    );
  }

  return {
    message: `验证邮件已发送到 ${email}。请在邮件中确认后返回这里设置密码。`,
    status: "success",
  };
}

export async function setAccountPassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!validatePassword(password)) {
    return errorState("密码至少需要 8 位。", {
      password: "请使用至少 8 位密码。",
    });
  }
  if (password !== confirmPassword) {
    return errorState("两次输入的密码不一致。", {
      confirmPassword: "请再次输入相同密码。",
    });
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user || data.user.is_anonymous || !data.user.email) {
    return errorState("邮箱还没有完成验证，请先打开验证邮件。", {
      password: "需要已验证的邮箱会话。",
    });
  }

  const currentMetadata = data.user.user_metadata ?? {};
  const { error } = await supabase.auth.updateUser({
    data: { ...currentMetadata, account_password_configured: true },
    password,
  });
  if (error) {
    return errorState(mapAuthError(error, "密码暂时无法保存，请稍后重试。"));
  }

  revalidatePath("/settings");
  return {
    message: "邮箱账号已保护。现在退出后也能用邮箱密码找回这间衣橱。",
    status: "success",
  };
}

export async function signInWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (!validateEmail(email)) fieldErrors.email = "请检查邮箱格式。";
  if (!password) fieldErrors.password = "请输入密码。";
  if (Object.keys(fieldErrors).length > 0) {
    return errorState("请先补全登录信息。", fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return errorState(mapAuthError(error, "邮箱或密码不正确，请检查后重试。"));
  }

  redirect("/");
}

export async function startAnonymousExperience() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) redirect("/login?error=anonymous-unavailable");

  const userId = data.user.id;
  const [profileResult, preferencesResult] = await Promise.all([
    supabase
      .from("profiles")
      .upsert(
        { user_id: userId },
        { ignoreDuplicates: true, onConflict: "user_id" },
      ),
    supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId },
        { ignoreDuplicates: true, onConflict: "user_id" },
      ),
  ]);
  if (profileResult.error || preferencesResult.error) {
    redirect("/login?error=anonymous-unavailable");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?status=signed-out");
}
