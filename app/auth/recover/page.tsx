import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { isEmailRecoveryEnabled } from "@/lib/auth/password-recovery";

export const metadata: Metadata = {
  title: "找回密码",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function RecoverPage() {
  return (
    <div className="mx-auto max-w-lg px-5 pt-5 pb-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        返回账号入口
      </Link>
      <h1 className="app-page-title mt-4">找回密码</h1>
      {isEmailRecoveryEnabled() ? (
        <RecoveryForm />
      ) : (
        <section className="surface-card mt-6 rounded-[2rem] p-5">
          <h2 className="app-section-title">验证码找回暂未开放</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            我们正在完成邮件发送验证。请保留已有登录；如果记得原密码，可在设置中直接修改。
          </p>
          <Link
            href="/support"
            className="motion-button mt-5 flex min-h-12 items-center justify-center rounded-full bg-[var(--control-primary)] px-5 py-3 text-sm font-semibold text-[var(--control-primary-foreground)]"
          >
            联系支持
          </Link>
        </section>
      )}
      <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
        找回过程不会自动切换当前账号。未注册的体验身份不能通过邮箱找回。
      </p>
      <Link
        href="/support"
        className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        需要帮助
      </Link>
    </div>
  );
}
