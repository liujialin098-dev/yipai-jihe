import { ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { IngestionWorkspace } from "@/components/wardrobe/ingestion-workspace";

export const metadata: Metadata = { title: "添加衣物" };

export default function AddWardrobeItemPage() {
  return (
    <div className="page-enter px-5 pt-4">
      <header>
        <span className="flex size-10 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
          <Sparkles className="size-4.5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold text-[var(--system-blue)]">
          AI 衣物识别
        </p>
        <h1 className="mt-2 max-w-[21rem] font-heading text-[2.75rem] leading-[0.98] font-bold tracking-[-0.07em] text-[var(--foreground)]">
          选原图，核对后放进衣橱。
        </h1>
        <p className="mt-4 max-w-[22rem] text-sm leading-6 text-[var(--text-secondary)]">
          AI
          会先给出类别、颜色和使用场景建议。每一项都可以修改，确认前不会成为正式衣物。
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--surface-soft)] px-3.5 py-3 text-xs leading-5 text-[var(--text-secondary)]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--system-blue)]" />
          <p>
            原图只存于当前匿名身份的私有空间。未确认内容最多保留 24
            小时；清除站点数据或更换设备后无法恢复当前身份。
          </p>
        </div>
      </header>
      <IngestionWorkspace />
    </div>
  );
}
