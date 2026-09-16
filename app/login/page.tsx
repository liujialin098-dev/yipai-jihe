import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand-mark";
import { BrandName } from "@/components/brand-name";
import { SupportLinks } from "@/components/support-links";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "账号登录" };

const feedback = {
  "anonymous-unavailable": "暂时无法建立新的匿名身份，请稍后重试。",
  "invalid-link": "旧验证链接已失效，请直接使用邮箱和密码登录。",
  "signed-out": "已安全退出当前设备。你的衣橱数据仍保留在原账号中。",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string; recovery?: string }>;
}) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const recoveryComplete = params.recovery === "complete";
  // This parameter only reveals the login form; it never grants identity or access.
  if (viewer?.needsOnboarding && !recoveryComplete) redirect("/onboarding");
  if (viewer && !viewer.isAnonymous && !recoveryComplete) redirect("/settings");

  const feedbackKey = params.error ?? params.status;
  const message =
    feedbackKey && feedbackKey in feedback
      ? feedback[feedbackKey as keyof typeof feedback]
      : null;

  return (
    <div className="page-enter px-5 pt-4">
      {viewer?.isAnonymous ? (
        <Link
          href="/settings"
          className="pressable inline-flex size-10 items-center justify-center rounded-full bg-[var(--surface-solid)] shadow-[var(--shadow-soft)]"
          aria-label="返回设置"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {!viewer ? (
        <div className="mb-10 flex items-center gap-3">
          <BrandMark className="size-11 shadow-[0_10px_26px_rgba(29,29,31,0.11)]" />
          <div>
            <BrandName className="auth-brand-name" />
          </div>
        </div>
      ) : null}
      <h1 className={`${viewer?.isAnonymous ? "mt-5 " : ""}app-page-title`}>
        登录 Ensemble
      </h1>

      {message ? (
        <div className="motion-status mt-5 flex gap-3 rounded-[1.2rem] bg-[var(--system-blue-soft)] px-4 py-3 text-sm leading-6 text-[var(--system-blue)]">
          <ShieldCheck className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {message}
        </div>
      ) : null}
      <LoginForm />
      {recoveryComplete && viewer?.isAnonymous ? (
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          登录其他邮箱账号会切换身份，当前体验衣橱不会自动合并。如需保留体验衣橱，请先在设置中注册。
        </p>
      ) : null}
      <SupportLinks />
    </div>
  );
}
