"use client";

import { useState, useTransition, type ReactNode } from "react";
import { setFashionContentRead } from "@/app/inspiration/actions";

export function ContentDetails({
  id,
  isRead,
  children,
}: {
  id: string;
  isRead: boolean;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <details
      className="mt-3 text-xs text-[var(--text-secondary)]"
      onToggle={(event) => {
        if (!event.currentTarget.open || isRead || pending) return;
        startTransition(async () => {
          try {
            const result = await setFashionContentRead(
              id,
              true,
              { ok: false, message: "" },
              new FormData(),
            );
            setMessage(result.ok ? "" : result.message);
          } catch {
            setMessage("阅读状态未保存，可以关闭详情后重试。");
          }
        });
      }}
    >
      <summary className="flex min-h-11 cursor-pointer items-center font-medium">
        内容详情与时效
      </summary>
      {children}
      <output className="mt-2 block text-xs">{message}</output>
    </details>
  );
}
