import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "登录恢复" };

const feedback = {
  "anonymous-unavailable": "暂时无法建立新的匿名身份，请稍后重试。",
  "invalid-link": "验证链接已失效或已使用，请回到设置页重新发送。",
  "signed-out": "已安全退出当前设备。你的衣橱数据仍保留在原账号中。",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  if (viewer && !viewer.isAnonymous) redirect("/settings");

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
      <p className="mt-5 text-xs font-semibold text-[var(--system-blue)]">
        跨设备恢复
      </p>
      <h1 className="mt-2 max-w-[21rem] font-heading text-[2.75rem] leading-[1.01] font-bold tracking-[-0.07em]">
        欢迎回来，衣橱还在原处。
      </h1>
      <p className="mt-4 max-w-[22rem] text-sm leading-6 text-[var(--text-secondary)]">
        使用已经验证并设置密码的邮箱登录，恢复同一账号下的衣物和偏好。
      </p>

      {message ? (
        <div className="motion-status mt-5 flex gap-3 rounded-[1.2rem] bg-[var(--system-blue-soft)] px-4 py-3 text-sm leading-6 text-[var(--system-blue)]">
          <ShieldCheck className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {message}
        </div>
      ) : null}
      <LoginForm />
    </div>
  );
}
