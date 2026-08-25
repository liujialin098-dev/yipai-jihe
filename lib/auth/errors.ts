import type { AuthError } from "@supabase/supabase-js";

export type AuthActionState = {
  fieldErrors?: {
    confirmPassword?: string;
    email?: string;
    password?: string;
  };
  message: string;
  status: "idle" | "success" | "error";
};

export const initialAuthState: AuthActionState = {
  message: "",
  status: "idle",
};

export function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string) {
  return password.length >= 8;
}

export function mapAuthError(
  error: AuthError | null,
  fallback = "操作没有完成，请稍后重试。",
) {
  if (!error) return fallback;

  switch (error.code) {
    case "email_address_invalid":
    case "validation_failed":
      return "邮箱格式不正确，请检查后重试。";
    case "email_exists":
    case "identity_already_exists":
      return "这个邮箱已经绑定，请直接登录原账号；系统不会发送验证邮件。";
    case "email_address_not_authorized":
      return "这个邮箱当前不可用于注册，请检查地址或联系管理员。";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "请求较多，请稍后再试。";
    case "weak_password":
      return "密码强度不足，请使用至少 8 位且不容易猜到的密码。";
    case "invalid_credentials":
      return "邮箱或密码不正确，请检查后重试。";
    case "same_password":
      return "新密码不能与当前密码相同。";
    case "session_not_found":
      return "登录状态已失效，请重新登录后再试。";
    default:
      return fallback;
  }
}

export function maskEmail(email: string | null | undefined) {
  if (!email) return null;
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}
