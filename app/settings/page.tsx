import type { Metadata } from "next";
import {
  ChevronRight,
  KeyRound,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { SkinPicker } from "@/components/skin-picker";
import {
  AccountProtectedBadge,
  EmailBindingForm,
  PasswordSetupForm,
} from "@/components/auth/account-forms";
import { signOut } from "@/lib/auth/actions";
import { getViewer } from "@/lib/auth/viewer";
import { clothingPreferenceLabel } from "@/lib/personalization/constants";

export const metadata: Metadata = { title: "设置" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ binding?: string }>;
}) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const verifiedNow = params.binding === "verified";

  return (
    <div className="page-enter px-5 pt-4">
      <h1 className="app-page-title">账号与偏好</h1>
      <SkinPicker />

      <section className="surface-card stagger-item mt-7 rounded-[1.65rem] p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#1d1d1f] text-white shadow-[0_10px_24px_rgba(29,29,31,0.18)]">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--foreground)]">
              {viewer?.displayName ?? "正在准备身份"}
            </p>
            <p className="mt-1 truncate text-xs text-[var(--text-tertiary)]">
              {viewer
                ? viewer.isAnonymous
                  ? `匿名编号 ${viewer.shortId}`
                  : `${viewer.emailMasked ?? "邮箱账号"} · 编号 ${viewer.shortId}`
                : "请稍候"}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 border-t border-[var(--hairline)] pt-4 text-sm leading-6 text-[var(--text-secondary)]">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-[var(--system-blue)]"
            aria-hidden="true"
          />
          {viewer?.isAnonymous
            ? "当前资料已按匿名身份隔离。绑定邮箱不会换号，也不会搬走或清空已有衣物。"
            : "邮箱已与原身份连接。退出或更换设备后，仍可恢复同一份衣橱数据。"}
        </div>
      </section>

      {viewer?.isAnonymous ? (
        <section
          id="account"
          className="surface-card stagger-item mt-5 scroll-mt-6 rounded-[1.65rem] p-5 [--stagger:1]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
              <KeyRound className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="app-section-title">注册账号</h2>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                输入邮箱和密码，当前页面直接完成
              </p>
            </div>
          </div>
          <EmailBindingForm />
        </section>
      ) : null}

      {viewer && !viewer.isAnonymous && !viewer.passwordConfigured ? (
        <section className="surface-card stagger-item mt-5 rounded-[1.65rem] p-5 [--stagger:1]">
          <p className="text-xs font-semibold text-[var(--system-blue)]">
            {verifiedNow ? "邮箱已绑定" : "最后一步"}
          </p>
          <h2 className="app-section-title mt-2">设置登录密码</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            直接在当前页面设置，无需再打开验证邮件。密码只会交给认证服务处理，不会保存到衣拍即合的数据表中。
          </p>
          <PasswordSetupForm />
        </section>
      ) : null}

      {viewer && !viewer.isAnonymous && viewer.passwordConfigured ? (
        <section className="surface-card stagger-item mt-5 rounded-[1.65rem] p-5 [--stagger:1]">
          <h2 className="app-section-title">邮箱登录</h2>
          <AccountProtectedBadge />
          <form action={signOut}>
            <button
              type="submit"
              className="motion-button mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-sm font-semibold"
            >
              <LogOut className="size-4" aria-hidden="true" />
              退出当前设备
            </button>
          </form>
        </section>
      ) : null}

      <section className="surface-card stagger-item mt-5 rounded-[1.5rem] p-5 [--stagger:2]">
        <div className="flex items-center justify-between">
          <h2 className="app-section-title">默认偏好</h2>
          <Link
            href="/settings/preferences"
            className="motion-button inline-flex h-9 items-center gap-1 rounded-full bg-[var(--surface-soft)] px-3 text-xs font-semibold text-[var(--system-blue)]"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            编辑
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <PreferenceRow label="风格" values={viewer?.preferredStyles ?? []} />
        <PreferenceRow label="场景" values={viewer?.preferredOccasions ?? []} />
        <PreferenceRow
          label="城市"
          values={viewer?.weatherCity ? [viewer.weatherCity] : ["待设置"]}
        />
        <PreferenceRow
          label="衣着"
          values={
            viewer ? [clothingPreferenceLabel(viewer.clothingPreference)] : []
          }
        />
      </section>
    </div>
  );
}

function PreferenceRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4 flex items-start gap-4 border-t border-[var(--hairline)] pt-4">
      <span className="w-9 pt-1 text-xs text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-[var(--system-blue-soft)] px-3 py-1 text-xs font-medium text-[var(--system-blue)]"
            >
              {value}
            </span>
          ))
        ) : (
          <span className="pt-1 text-xs text-[var(--text-tertiary)]">
            正在载入
          </span>
        )}
      </div>
    </div>
  );
}
