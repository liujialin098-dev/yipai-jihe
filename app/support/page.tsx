import type { Metadata } from "next";
import Link from "next/link";
import { SupportLinks } from "@/components/support-links";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

export const metadata: Metadata = { title: "帮助与联系" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-lg px-5 pt-5 pb-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        返回首页
      </Link>
      <h1 className="app-page-title mt-4">帮助与联系</h1>
      <section className="surface-card mt-6 rounded-[2rem] p-5">
        <h2 className="app-section-title">联系我们</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          账号、衣橱或隐私相关问题，都可以通过下面的邮箱联系。
        </p>
        <a
          href={SUPPORT_MAILTO}
          className="mt-4 block min-h-12 content-center break-all text-base font-semibold underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          点击会打开你的邮件应用；也可以复制邮箱手动发送。请勿发送密码、验证码、密钥或身份证照片。
        </p>
      </section>
      <section className="surface-card mt-5 rounded-[2rem] p-5">
        <h2 className="app-section-title">账号与密码</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          记得原密码时，在设置中修改。忘记密码请查看验证码找回入口；体验身份未注册时不能用邮箱恢复。
        </p>
        <Link
          href="/auth/recover"
          className="motion-button mt-4 flex min-h-12 items-center justify-center rounded-full bg-[var(--control-primary)] px-5 py-3 text-sm font-semibold text-[var(--control-primary-foreground)]"
        >
          找回密码
        </Link>
      </section>
      <section className="surface-card mt-5 rounded-[2rem] p-5">
        <h2 className="app-section-title">数据与账号删除</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          应用内自助注销尚未开放。你可以联系支持提出数据查询、更正或删除请求，处理前需要核实身份；发送邮件本身不会自动注销账号。
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          退出登录不等于删除账号。请保留当前登录，避免尚未注册的体验衣橱无法找回。
        </p>
      </section>
      <SupportLinks />
    </div>
  );
}
