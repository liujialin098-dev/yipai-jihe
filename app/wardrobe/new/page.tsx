import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { IngestionWorkspace } from "@/components/wardrobe/ingestion-workspace";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "添加衣物" };

export default function AddWardrobeItemPage() {
  return (
    <div className="page-enter px-5 pt-4">
      <div>
        <PageHeading title="添加衣物" />
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--surface-soft)] px-3.5 py-3 text-xs leading-5 text-[var(--text-secondary)]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--system-blue)]" />
          <p>
            原图只存于当前匿名身份的私有空间。未确认内容最多保留 24
            小时；清除站点数据或更换设备后无法恢复当前身份。
          </p>
        </div>
      </div>
      <IngestionWorkspace />
    </div>
  );
}
