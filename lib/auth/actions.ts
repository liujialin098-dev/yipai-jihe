"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function registerCurrentAccount(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (!validateEmail(email)) {
    fieldErrors.email = "邮箱格式不正确。";
  }
  if (!validatePassword(password)) {
    fieldErrors.password = "请使用至少 8 位密码。";
  }
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "请再次输入相同密码。";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return errorState("请检查注册信息后再试。", fieldErrors);
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return errorState("匿名身份已失效，请刷新页面重新开始。", {
      email: "当前没有可绑定的匿名身份。",
    });
  }
  if (!data.user.is_anonymous) {
    redirect("/settings");
  }

  const { data: emailData, error: emailError } = await supabase.auth.updateUser(
    { email },
  );

  if (emailError) {
    return errorState(
      mapAuthError(emailError, "账号暂时无法注册，请稍后重试。"),
    );
  }

  if (!emailData.user || emailData.user.is_anonymous || !emailData.user.email) {
    return errorState(
      "项目仍要求邮箱验证，暂时没有完成注册。请先关闭邮件确认后再试。",
    );
  }

  const currentMetadata = emailData.user.user_metadata ?? {};
  const { error: passwordError } = await supabase.auth.updateUser({
    data: { ...currentMetadata, account_password_configured: true },
    password,
  });
  if (passwordError) {
    revalidatePath("/settings");
    return errorState(
      mapAuthError(
        passwordError,
        "邮箱已绑定，但密码暂时没有设置成功。请刷新页面后直接设置密码。",
      ),
    );
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return {
    message: "注册完成。以后可以直接使用邮箱和密码登录这间衣橱。",
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
    return errorState("当前不是已绑定邮箱的账号，请先注册或登录。", {
      password: "需要已绑定邮箱的登录会话。",
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
    message: "密码设置完成。现在可以直接使用邮箱和密码登录。",
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
