"use server";

import {
  type RecoveryState,
  requestRecoveryCode,
  resetPasswordWithCode,
} from "@/lib/auth/password-recovery";

export async function recoverAccount(
  _previous: RecoveryState,
  form: FormData,
): Promise<RecoveryState> {
  switch (form.get("operation")) {
    case "send":
      return requestRecoveryCode(form);
    case "reset":
      return resetPasswordWithCode(form);
    default:
      return { status: "error", message: "操作未识别，请刷新页面后重试。" };
  }
}
