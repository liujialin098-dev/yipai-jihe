import type { Metadata } from "next";
import { ShieldCheck, UserRound } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "设置" };

export default async function SettingsPage() {
  const viewer = await getViewer();

  return (
    <div className="px-5 pt-6">
      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[#817987] uppercase">
        账户与偏好
      </p>
      <h1 className="mt-2 font-heading text-[2.2rem] leading-tight font-semibold tracking-[-0.035em] text-[#20202a]">
        先匿名体验，资料只属于你。
      </h1>
      <section className="mt-6 rounded-[2rem] bg-[#20202a] p-5 text-white shadow-[0_18px_55px_rgba(32,32,42,0.18)]">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">
              {viewer?.displayName ?? "正在准备身份"}
            </p>
            <p className="mt-1 text-xs tracking-[0.08em] text-white/55 uppercase">
              {viewer ? `匿名编号 ${viewer.shortId}` : "请稍候"}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 border-t border-white/10 pt-4 text-sm leading-6 text-white/65">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-[#a8c7b3]"
            aria-hidden="true"
          />
          当前资料由 Supabase 匿名身份隔离。邮箱绑定和跨设备恢复将在 SDD-002
          开放。
        </div>
      </section>
      <section className="mt-5 rounded-3xl border border-black/6 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-[#292631]">
            默认偏好
          </h2>
          <span className="text-xs text-[#8b8590]">暂不可编辑</span>
        </div>
        <PreferenceRow label="风格" values={viewer?.preferredStyles ?? []} />
        <PreferenceRow label="场景" values={viewer?.preferredOccasions ?? []} />
      </section>
    </div>
  );
}

function PreferenceRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4 flex items-start gap-4 border-t border-black/6 pt-4">
      <span className="w-9 pt-1 text-xs text-[#8b8590]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-[#eeeafe] px-3 py-1 text-xs font-medium text-[#5642bf]"
            >
              {value}
            </span>
          ))
        ) : (
          <span className="pt-1 text-xs text-[#8b8590]">正在载入</span>
        )}
      </div>
    </div>
  );
}
