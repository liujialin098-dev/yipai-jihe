import type { ComponentProps } from "react";
import type { RecoveryState } from "../../lib/auth/password-recovery";

// Only test fixtures: no auth calls, persistence, or real credentials.
export async function recoverAccount(
  _state: RecoveryState,
  data: FormData,
): Promise<RecoveryState> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (data.get("operation") === "send") {
    if (data.get("email") !== "fixture@example.invalid")
      return {
        status: "error",
        message: "请检查邮箱。",
        fieldErrors: { email: "请输入有效的邮箱地址。" },
      };
    return {
      status: "success",
      phase: "code",
      message: "请求已处理。若邮箱已有账号且请求通过限制，你会收到数字验证码。",
    };
  }
  if (data.get("password") !== data.get("confirmPassword"))
    return {
      status: "error",
      message: "请检查以下输入。",
      fieldErrors: { confirmPassword: "两次输入的密码不一致。" },
    };
  if (data.get("token") !== "123456")
    return {
      status: "error",
      message: "验证码未通过验证或已失效。",
      fieldErrors: { token: "请获取新的验证码。" },
    };
  return {
    status: "success",
    phase: "reset",
    message: "密码已重设，请用新密码登录。",
  };
}
export function isEmailRecoveryEnabled() {
  return false;
}
export function BrandMotion() {
  return <span>返回账号入口</span>;
}
export default function FixtureLink(props: ComponentProps<"a">) {
  return <a {...props} />;
}
export function usePathname() {
  return window.location.pathname;
}
export function useRouter() {
  return {
    replace(path: string) {
      document.body.dataset.unexpectedRedirect = path;
    },
  };
}
