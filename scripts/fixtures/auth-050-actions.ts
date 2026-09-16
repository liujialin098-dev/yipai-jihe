import type { AuthActionState } from "../../lib/auth/errors";

// 仅隔离浏览器表单的反馈假体，不请求认证，不保存输入。
export async function setAccountPassword(
  _state: AuthActionState,
  data: FormData,
): Promise<AuthActionState> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (data.get("currentPassword") === "incorrect-fixture") {
    return {
      status: "error",
      message: "原密码验证没有通过。",
      fieldErrors: { currentPassword: "请检查原密码后重试。" },
    };
  }
  if (data.get("password") !== data.get("confirmPassword")) {
    return {
      status: "error",
      message: "请检查以下输入。",
      fieldErrors: { confirmPassword: "两次输入的新密码不一致。" },
    };
  }
  return {
    status: "success",
    message: "密码已修改。后续登录请使用新密码；如当前会话失效，请重新登录。",
  };
}

export async function registerCurrentAccount(): Promise<AuthActionState> {
  throw new Error("本隔离样本不支持注册");
}

export function useRouter() {
  return { refresh() {} };
}
