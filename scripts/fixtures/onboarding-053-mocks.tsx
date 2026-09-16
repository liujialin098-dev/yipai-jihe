import type { AnchorHTMLAttributes } from "react";
import type { OnboardingChoices } from "@/lib/onboarding/model";
import type { AuthActionState } from "@/lib/auth/errors";

// Isolated UI transport only. Never call a real identity or persistence service.
declare global {
  interface Window {
    onboardingCalls: OnboardingChoices[];
    onboardingFail: boolean;
    onboardingRoute: string;
    diaryIds: string[];
    diaryFail: boolean;
  }
}
window.onboardingCalls = [];
export async function completeOnboarding(input: OnboardingChoices) {
  window.onboardingCalls.push(input);
  await new Promise((done) => setTimeout(done, 150));
  return window.onboardingFail
    ? { ok: false, message: "保存失败，选择已保留，请重试。" }
    : { ok: true, message: "" };
}
export function useRouter() {
  return {
    refresh() {},
    replace(path: string) {
      window.onboardingRoute = path;
    },
  };
}
export default function Link({
  prefetch: _,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  return <a {...props} />;
}
const refuseAuth = async (): Promise<AuthActionState> => ({
  status: "error",
  message: "隔离预览不提交真实身份。",
});
export const registerCurrentAccount = refuseAuth;
export const setAccountPassword = refuseAuth;
export const signInWithEmail = refuseAuth;
export const startAnonymousExperience = refuseAuth;
export async function saveManualDiaryEntry(_state: unknown, form: FormData) {
  if (window.diaryFail) throw new Error("fixture network failure");
  window.diaryIds = form.getAll("itemIds").map(String);
  return { status: "success" as const, message: "隔离记录已保存" };
}
