"use client";

import { useActionState, useTransition, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { setFashionContentRead } from "@/app/inspiration/actions";

export function ReadingControls({
  id,
  isRead,
  sourceUrl,
  sourceName,
}: {
  id: string;
  isRead: boolean;
  sourceUrl: string;
  sourceName: string;
}) {
  const [state, action, pending] = useActionState(
    setFashionContentRead.bind(null, id, !isRead),
    { ok: false, message: "" },
  );
  const [opening, startTransition] = useTransition();
  const [linkMessage, setLinkMessage] = useState("");
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap justify-end gap-2">
        <form action={action}>
          <button
            type="submit"
            disabled={pending || opening}
            className="motion-button h-11 rounded-full bg-[var(--surface-soft)] px-3.5 text-xs font-semibold text-[var(--foreground)]"
          >
            {pending ? "保存中…" : isRead ? "设为未读" : "标记已读"}
          </button>
        </form>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          onClick={() => {
            if (!isRead)
              startTransition(async () => {
                try {
                  const result = await setFashionContentRead(
                    id,
                    true,
                    { ok: false, message: "" },
                    new FormData(),
                  );
                  setLinkMessage(result.message);
                } catch {
                  setLinkMessage("原文已打开，但阅读状态未保存，请重试。");
                }
              });
          }}
          aria-label={`阅读 ${sourceName} 原文（新窗口打开）`}
          className="motion-button flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--control-primary)] px-3.5 text-xs font-semibold text-[var(--control-primary-foreground)]"
        >
          阅读原文
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
      <output className="mt-1 max-w-48 text-xs leading-5 text-[var(--text-secondary)]">
        {linkMessage || state.message}
      </output>
    </div>
  );
}
