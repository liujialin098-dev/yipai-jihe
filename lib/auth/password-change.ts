import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthActionState } from "@/lib/auth/errors";
import { getSupabaseConfig } from "@/lib/supabase/config";

function failure(
  message: string,
  fieldErrors?: AuthActionState["fieldErrors"],
): AuthActionState {
  return { status: "error", message, fieldErrors };
}

function passwordValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function changePassword(
  client: { auth: Pick<SupabaseClient["auth"], "getUser"> },
  formData: FormData,
): Promise<AuthActionState> {
  const currentPassword = passwordValue(formData, "currentPassword");
  const password = passwordValue(formData, "password");
  const confirmPassword = passwordValue(formData, "confirmPassword");
  const fieldErrors: NonNullable<AuthActionState["fieldErrors"]> = {};
  if (!currentPassword || currentPassword.length > 1024) {
    fieldErrors.currentPassword = "请输入有效的原密码。";
  }
  if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
    fieldErrors.password =
      "新密码至少 8 位，最长 72 字节；中文和表情会占用多个字节。";
  } else if (password === currentPassword) {
    fieldErrors.password = "新密码不能与原密码相同。";
  }
  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = "两次输入的新密码不一致。";
  }
  if (Object.keys(fieldErrors).length) {
    return failure("请检查以下输入。", fieldErrors);
  }

  let verifier: SupabaseClient | undefined;
  let updateStarted = false;
  try {
    const { data, error } = await client.auth.getUser();
    const user = data.user;
    if (error || !user || user.is_anonymous || !user.email) {
      return failure("请先登录邮箱账号，再修改密码。体验身份请先注册。");
    }
    const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
    verifier = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    const verification = await verifier.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verification.error) {
      if (verification.error.code === "over_request_rate_limit") {
        return failure("尝试较多，请稍后再试。");
      }
      if (verification.error.code === "invalid_credentials") {
        return failure("原密码验证没有通过。", {
          currentPassword: "请检查原密码后重试。",
        });
      }
      return failure("暂时无法验证原密码，请稍后再试。");
    }
    if (
      !verification.data.session ||
      verification.data.user?.id !== user.id ||
      verification.data.user.is_anonymous
    ) {
      return failure("身份验证没有完成，请重新登录后再试。");
    }
    updateStarted = true;
    const updated = await verifier.auth.updateUser({
      password,
      current_password: currentPassword,
      data: { account_password_configured: true },
    });
    if (updated.error) {
      switch (updated.error.code) {
        case "weak_password":
          return failure("请使用更安全的新密码。", {
            password: "请避开常见或已泄露的密码。",
          });
        case "same_password":
          return failure("新密码不能与原密码相同。", {
            password: "请换一个新密码。",
          });
        case "reauthentication_needed":
        case "reauthentication_not_valid":
          return failure(
            "认证服务要求额外验证。请先重新登录；本次不会发送验证链接。",
          );
        case "over_request_rate_limit":
          return failure("尝试较多，请稍后再试。");
        default:
          return failure("暂时无法确认修改结果，请先尝试用新密码登录。");
      }
    }
    if (updated.data.user?.id !== user.id) {
      return failure("暂时无法确认修改结果，请先尝试用新密码登录。");
    }
    return {
      status: "success",
      message: "密码已修改。后续登录请使用新密码；如当前会话失效，请重新登录。",
    };
  } catch {
    return failure(
      updateStarted
        ? "连接中断，暂时无法确认修改结果，请先尝试用新密码登录。"
        : "暂时无法连接认证服务，请稍后再试。",
    );
  } finally {
    if (verifier) {
      try {
        // 只清理本次验证的临时会话，不登出用户原有设备。
        await verifier.auth.signOut({ scope: "local" });
      } catch {
        // 临时会话清理失败不能反转已成功的密码修改。
      }
    }
  }
}
