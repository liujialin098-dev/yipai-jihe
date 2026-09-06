"use client";

import { Check, LoaderCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";
import { replaceDailyRecommendationItem } from "@/app/recommendations/actions";
import { INITIAL_RECOMMENDATION_ACTION_STATE } from "@/lib/recommendations/constants";
import type { WardrobeItem } from "@/lib/wardrobe/data";

export function ReplaceItemPanel({
  recommendationId,
  slot,
  currentItem,
  candidates,
}: {
  recommendationId: string;
  slot: number;
  currentItem: WardrobeItem;
  candidates: WardrobeItem[];
}) {
  const [state, action, pending] = useActionState(
    replaceDailyRecommendationItem,
    INITIAL_RECOMMENDATION_ACTION_STATE,
  );

  return (
    <details className="group rounded-[1rem] bg-white/82 open:shadow-[0_12px_30px_rgba(29,29,31,0.12)]">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-semibold text-[var(--foreground)]">
        <span className="truncate">{currentItem.name}</span>
        <span className="flex shrink-0 items-center gap-1 text-[var(--system-blue)]">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          换一件
        </span>
      </summary>
      <div className="border-t border-[var(--hairline)] p-2.5">
        {candidates.length > 0 ? (
          <form action={action} className="grid grid-cols-2 gap-2">
            <input
              type="hidden"
              name="recommendationId"
              value={recommendationId}
            />
            <input type="hidden" name="slot" value={slot} />
            <input type="hidden" name="currentItemId" value={currentItem.id} />
            {candidates.slice(0, 6).map((candidate) => (
              <button
                key={candidate.id}
                type="submit"
                name="replacementItemId"
                value={candidate.id}
                disabled={pending}
                className="interaction-preserve motion-button overflow-hidden rounded-[0.85rem] border border-[var(--hairline)] bg-[var(--surface-solid)] text-left"
              >
                <span className="relative block aspect-square bg-[var(--surface-soft)]">
                  {candidate.imageUrl ? (
                    <Image
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      fill
                      sizes="150px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="flex items-center justify-between gap-1 px-2 py-2 text-[0.68rem] font-medium">
                  <span className="truncate">{candidate.name}</span>
                  {pending ? (
                    <LoaderCircle
                      className="size-3 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check className="size-3" aria-hidden="true" />
                  )}
                </span>
              </button>
            ))}
          </form>
        ) : (
          <p className="px-1 py-2 text-xs leading-5 text-[var(--text-secondary)]">
            暂时没有同类、未占用且适合当前天气和场合的候选。
          </p>
        )}
        {state.message ? (
          <output
            aria-live="polite"
            className="mt-2 block rounded-[0.75rem] bg-[var(--surface-soft)] px-2.5 py-2 text-[0.68rem] text-[var(--text-secondary)]"
          >
            {state.message}
          </output>
        ) : null}
      </div>
    </details>
  );
}
