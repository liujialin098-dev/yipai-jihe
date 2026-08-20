"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-5 mt-6 rounded-[2rem] border border-[#ff8068]/25 bg-[#fff2ef] p-6 text-[#5a2a22]">
      <TriangleAlert className="size-5 text-[#d45c49]" aria-hidden="true" />
      <h1 className="mt-8 font-heading text-3xl font-semibold tracking-tight">
        这一页暂时没整理好。
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#7b514a]">
        数据没有被修改。重新载入即可继续，若仍失败请检查连接配置。
      </p>
      <Button type="button" className="mt-5" onClick={reset}>
        <RotateCw aria-hidden="true" />
        重新载入
      </Button>
    </div>
  );
}
