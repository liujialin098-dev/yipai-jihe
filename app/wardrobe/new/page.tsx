import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { IngestionWorkspace } from "@/components/wardrobe/ingestion-workspace";

export const metadata: Metadata = { title: "添加衣物" };

export default function AddWardrobeItemPage() {
  return (
    <div className="page-enter px-5 pt-4">
      <header>
        <h1 className="app-page-title">添加衣物</h1>
        <p className="app-page-lead mt-3">
          选择照片后，系统会填写类别、颜色和场景建议。核对无误再保存。
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
