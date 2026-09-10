"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-enter mx-5 mt-4 rounded-[1.75rem] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-6 text-[var(--foreground)]">
      <TriangleAlert
        className="size-5 text-[var(--danger-text)]"
        aria-hidden="true"
      />
      <h1 className="app-page-title mt-10">页面暂时无法打开</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        数据没有被修改。重新载入即可继续，若仍失败请检查连接配置。
      </p>
      <Button type="button" className="mt-5" onClick={reset}>
        <RotateCw aria-hidden="true" />
        重新载入
      </Button>
    </div>
  );
}
