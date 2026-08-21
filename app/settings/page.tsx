import type { Metadata } from "next";
import { ShieldCheck, UserRound } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "设置" };

export default async function SettingsPage() {
  const viewer = await getViewer();

  return (
    <div className="page-enter px-5 pt-4">
      <p className="text-xs font-semibold text-[var(--system-blue)]">
        账户与偏好
      </p>
      <h1 className="mt-2 max-w-[20rem] font-heading text-[2.65rem] leading-[1.02] font-bold tracking-[-0.065em] text-[var(--foreground)]">
        先匿名体验，资料只属于你。
      </h1>
      <section className="surface-card mt-7 rounded-[1.65rem] p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#1d1d1f] text-white shadow-[0_10px_24px_rgba(29,29,31,0.18)]">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              {viewer?.displayName ?? "正在准备身份"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {viewer ? `匿名编号 ${viewer.shortId}` : "请稍候"}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 border-t border-[var(--hairline)] pt-4 text-sm leading-6 text-[var(--text-secondary)]">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-[var(--system-blue)]"
            aria-hidden="true"
          />
          当前资料由 Supabase 匿名身份隔离。邮箱绑定和跨设备恢复将在 SDD-002
          开放。
        </div>
      </section>
      <section className="surface-card mt-5 rounded-[1.5rem] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold tracking-[-0.035em] text-[var(--foreground)]">
            默认偏好
          </h2>
          <span className="text-xs text-[var(--text-tertiary)]">
            暂不可编辑
          </span>
        </div>
        <PreferenceRow label="风格" values={viewer?.preferredStyles ?? []} />
        <PreferenceRow label="场景" values={viewer?.preferredOccasions ?? []} />
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
