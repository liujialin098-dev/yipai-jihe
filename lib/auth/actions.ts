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
import { changePassword } from "@/lib/auth/password-change";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function initializeAccountRecords(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  const profileReady = await runInitializationWrite(
    supabase,
    userId,
    async () =>
      await supabase
        .from("profiles")
        .upsert(
          { user_id: userId },
          { ignoreDuplicates: true, onConflict: "user_id" },
        ),
  );
  if (!profileReady) return false;

  return runInitializationWrite(
    supabase,
    userId,
    async () =>
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: userId },
          { ignoreDuplicates: true, onConflict: "user_id" },
        ),
  );
}

async function runInitializationWrite(
  supabase: ServerSupabaseClient,
  userId: string,
  write: () => PromiseLike<{ error: unknown | null }>,
) {
  const firstAttempt = await write();
  if (!firstAttempt.error) return true;

  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) return false;

  const retry = await write();
  return !retry.error;
}

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
  const currentUser = userError ? null : data.user;

  if (!currentUser) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: { account_password_configured: true },
        },
      },
    );

    if (signUpError) {
      return errorState(
        mapAuthError(signUpError, "账号暂时无法注册，请稍后重试。"),
      );
    }

    if (!signUpData.session || !signUpData.user) {
      const existingIdentity = signUpData.user?.identities?.length === 0;
      return errorState(
        existingIdentity
          ? "这个邮箱已经注册，请切换到登录。"
          : "注册没有立即建立会话。请确认 Supabase 已关闭邮件确认后再试。",
      );
    }

    if (!(await initializeAccountRecords(supabase, signUpData.user.id))) {
      await supabase.auth.signOut({ scope: "local" });
      return errorState(
        "账号已建立，但衣橱资料暂时没有准备好。请稍后直接登录，系统会继续完成初始化。",
      );
    }

    revalidatePath("/");
    revalidatePath("/settings");
    return {
      message: "注册完成，正在进入你的衣橱。",
      status: "success",
    };
  }

  if (!currentUser.is_anonymous) {
    redirect("/");
  }

  const { data: emailData, error: emailError } = await supabase.auth.updateUser(
    { email, password, data: { account_password_configured: true } },
  );

  if (emailError) {
    return errorState(
      mapAuthError(emailError, "账号暂时无法注册，请稍后重试。"),
    );
  }

  if (
    !emailData.user ||
    emailData.user.id !== currentUser.id ||
    emailData.user.is_anonymous ||
    !emailData.user.email
  ) {
    return errorState(
      "项目仍要求邮箱验证，暂时没有完成注册。请先关闭邮件确认后再试。",
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
  let result: AuthActionState;
  try {
    const supabase = await createClient();
    result = await changePassword(supabase, formData);
  } catch {
    return errorState("暂时无法连接认证服务，请稍后再试。");
  }
  if (result.status === "success") revalidatePath("/settings");
  return result;
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return errorState(mapAuthError(error, "邮箱或密码不正确，请检查后重试。"));
  }

  if (!(await initializeAccountRecords(supabase, data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    return errorState("衣橱资料暂时没有准备好，请稍后重新登录。");
  }

  redirect("/");
}

export async function startAnonymousExperience() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) redirect("/?error=anonymous-unavailable");

  if (!(await initializeAccountRecords(supabase, data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/?error=anonymous-unavailable");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?status=signed-out");
}
