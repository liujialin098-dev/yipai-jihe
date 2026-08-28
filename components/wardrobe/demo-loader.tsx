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
              ? "liquid-glass-web pressable inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-[var(--foreground)] disabled:opacity-60"
              : "pressable inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(29,29,31,0.2)] disabled:opacity-60"
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
            ? compact
              ? "正在补齐演示衣物"
              : "正在准备演示衣橱"
            : compact
              ? "继续加载演示衣橱"
              : "加载演示衣橱"}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-3 text-xs leading-5 ${
            state.status === "error" ? "text-[#c9342f]" : "text-[#248a3d]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
