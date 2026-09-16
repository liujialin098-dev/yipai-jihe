import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail, validateEmail } from "@/lib/auth/errors";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type RecoveryState = {
  status: "idle" | "success" | "error";
  message: string;
  phase?: "code" | "reset";
  needsNewCode?: boolean;
  fieldErrors?: Partial<
    Record<"email" | "token" | "password" | "confirmPassword", string>
  >;
};

export function isEmailRecoveryEnabled() {
  // Only enable after the numeric email template and delivery/security gates are verified.
  return process.env.ACCOUNT_EMAIL_RECOVERY_ENABLED === "true";
}

function failure(
  message: string,
  fieldErrors?: RecoveryState["fieldErrors"],
): RecoveryState {
  return { status: "error", message, fieldErrors };
}

function unavailable() {
  return failure("邮箱验证码找回暂未开放。请保留已有登录，或联系支持。");
}

function value(form: FormData, key: string) {
  const entry = form.get(key);
  return typeof entry === "string" ? entry : "";
}

function temporaryClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function requestRecoveryCode(
  form: FormData,
): Promise<RecoveryState> {
  if (!isEmailRecoveryEnabled()) return unavailable();
  const email = normalizeEmail(form.get("email"));
  if (email.length > 254 || !validateEmail(email)) {
    return failure("请检查邮箱地址。", { email: "请输入有效的邮箱地址。" });
  }
  try {
    // Returned provider errors (including unknown email and per-address rate limits)
    // intentionally share one response. This is not a delivery confirmation.
    await temporaryClient().auth.resetPasswordForEmail(email);
    return {
      status: "success",
      phase: "code",
      message:
        "请求已处理。若邮箱已有账号且请求通过限制，你会收到数字验证码。未收到时请检查垃圾邮件或稍后重试。",
    };
  } catch {
    return failure("连接中断，暂时无法确认发送结果。请检查邮箱，稍后再试。");
  }
}

export async function resetPasswordWithCode(
  form: FormData,
): Promise<RecoveryState> {
  if (!isEmailRecoveryEnabled()) return unavailable();
  const email = normalizeEmail(form.get("email"));
  const token = value(form, "token").trim();
  const password = value(form, "password");
  const confirmPassword = value(form, "confirmPassword");
  const fields: NonNullable<RecoveryState["fieldErrors"]> = {};
  if (email.length > 254 || !validateEmail(email))
    fields.email = "请输入有效的邮箱地址。";
  if (!/^\d{6,10}$/.test(token))
    fields.token = "请输入邮件中的完整数字验证码。";
  if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
    fields.password = "密码至少 8 位，最长 72 字节；中文和表情占用多个字节。";
  }
  if (confirmPassword !== password)
    fields.confirmPassword = "两次输入的密码不一致。";
  if (Object.keys(fields).length) return failure("请检查以下输入。", fields);

  let client: SupabaseClient | undefined;
  let updated = false;
  let result: RecoveryState = failure("暂时无法连接认证服务，请稍后再试。");
  let verified = false;
  try {
    client = temporaryClient();
    const response = await client.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    const { user, session } = response.data;
    if (
      response.error ||
      !user ||
      !session ||
      user.is_anonymous ||
      session.user.id !== user.id ||
      session.user.is_anonymous ||
      user.email?.toLowerCase() !== email ||
      session.user.email?.toLowerCase() !== email
    ) {
      result = failure("验证码未通过验证或已失效，请核对邮箱与最新验证码。", {
        token: "请重新输入，或获取新的验证码。",
      });
    } else {
      verified = true;
      const response = await client.auth.updateUser({
        password,
        data: { account_password_configured: true },
      });
      if (response.error || response.data.user?.id !== user.id) {
        result = {
          ...failure(
            response.error?.code === "weak_password"
              ? "新密码强度不足，请获取新的验证码后使用更安全的密码。"
              : "暂时无法确认改密结果，请先尝试新密码；如需重试，请获取新的验证码。",
          ),
          needsNewCode: true,
        };
      } else {
        updated = true;
        result = {
          status: "success",
          phase: "reset",
          message:
            "密码已重设，请用新密码登录。已请求撤销旧登录会话，已有访问令牌可能在过期前仍有效。",
        };
      }
    }
  } catch {
    result = {
      ...failure(
        verified
          ? "连接中断，暂时无法确认改密结果，请先尝试新密码；如需重试，请获取新的验证码。"
          : "暂时无法完成验证，请稍后重试；若验证码失效，请重新获取。",
      ),
      needsNewCode: verified,
    };
  } finally {
    if (client) {
      try {
        const cleanup = await client.auth.signOut({
          scope: updated ? "global" : "local",
        });
        if (updated && cleanup.error) {
          result.message =
            "密码已重设，但旧会话撤销结果未确认。请用新密码登录并检查其他设备。";
        }
      } catch {
        if (updated)
          result.message =
            "密码已重设，但旧会话撤销结果未确认。请用新密码登录并检查其他设备。";
      }
    }
  }
  return result;
}
