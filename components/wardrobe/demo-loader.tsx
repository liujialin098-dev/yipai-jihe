"use client";

import { Database, LoaderCircle, RotateCcw } from "lucide-react";
import { useActionState } from "react";
import { loadDemoWardrobe } from "@/app/wardrobe/actions";
import { INITIAL_ACTION_STATE } from "@/lib/wardrobe/validation";

export function DemoLoader({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(
    loadDemoWardrobe,
    INITIAL_ACTION_STATE,
  );

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className={
            compact
              ? "inline-flex min-h-10 items-center gap-2 rounded-full border border-black/8 bg-white px-4 text-xs font-semibold text-[#433d49] shadow-sm transition-transform active:translate-y-px disabled:opacity-60"
              : "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ff8068] px-5 text-sm font-semibold text-[#351a16] shadow-[0_10px_28px_rgba(255,128,104,0.24)] transition-transform active:translate-y-px disabled:opacity-60"
          }
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : compact ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <Database className="size-4" aria-hidden="true" />
          )}
          {pending
            ? "正在准备 24 件衣物"
            : compact
              ? "检查并补齐演示数据"
              : "加载 24 件演示衣物"}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-3 text-xs leading-5 ${
            state.status === "error" ? "text-[#a53f35]" : "text-[#4d745e]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
