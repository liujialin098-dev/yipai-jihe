"use client";

import { CalendarCheck, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { saveRecommendationToDiary } from "@/app/diary/actions";
import { INITIAL_DIARY_ACTION_STATE } from "@/lib/diary/validation";

export function RecommendationDiaryButton({
  recommendationId,
  slot,
}: {
  recommendationId: string;
  slot: number;
}) {
  const [state, formAction, pending] = useActionState(
    saveRecommendationToDiary,
    INITIAL_DIARY_ACTION_STATE,
  );

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="recommendationId" value={recommendationId} />
        <input type="hidden" name="slot" value={slot} />
        <button
          type="submit"
          disabled={pending}
          className="motion-button flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-4 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : state.status === "success" ? (
            <Check
              className="size-4 text-[var(--success-text)]"
              aria-hidden="true"
            />
          ) : (
            <CalendarCheck className="size-4" aria-hidden="true" />
          )}
          {pending
            ? "正在记录"
            : state.status === "success"
              ? "已记入今日"
              : "记为今日穿搭"}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-2 text-xs leading-5 ${
            state.status === "error"
              ? "text-[var(--danger-text)]"
              : "text-[var(--success-text)]"
          }`}
        >
          {state.message}
          {state.status === "success" ? (
            <Link
              href="/diary"
              className="ml-1 font-semibold underline underline-offset-2"
            >
              查看日记
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
