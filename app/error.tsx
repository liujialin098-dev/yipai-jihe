"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-enter mx-5 mt-4 rounded-[1.75rem] border border-[#ff453a]/20 bg-[#ff453a]/8 p-6 text-[var(--foreground)]">
      <TriangleAlert className="size-5 text-[#d45c49]" aria-hidden="true" />
      <h1 className="mt-10 font-heading text-3xl font-bold tracking-[-0.05em]">
        这一页暂时没整理好。
      </h1>
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
