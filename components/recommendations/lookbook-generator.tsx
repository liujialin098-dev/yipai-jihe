"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateRecommendationLookbook } from "@/app/recommendations/actions";
import type { LookbookActionState } from "@/app/recommendations/actions";

const initialLookbookActionState: LookbookActionState = {
  status: "idle",
  message: "",
};

function GenerateButton({ hasImage }: { hasImage: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(29,29,31,0.18)] disabled:cursor-wait disabled:opacity-65"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="size-4" strokeWidth={1.8} aria-hidden="true" />
      )}
      {pending
        ? "正在生成效果图…"
        : hasImage
          ? "重新生成效果图"
          : "生成虚拟模特效果图"}
    </button>
  );
}

export function LookbookGenerator({
  hasImage,
  recommendationId,
  slot,
}: {
  hasImage: boolean;
  recommendationId: string;
  slot: 1 | 2 | 3;
}) {
  const [state, formAction] = useActionState(
    generateRecommendationLookbook,
    initialLookbookActionState,
  );

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="recommendationId" value={recommendationId} />
      <input type="hidden" name="slot" value={slot} />
      <GenerateButton hasImage={hasImage} />
      {state.status !== "idle" ? (
        <output
          className={`motion-status mt-2 text-center text-xs leading-5 ${
            state.status === "error"
              ? "text-[#b42318]"
              : "text-[var(--text-secondary)]"
          }`}
        >
          {state.message}
        </output>
      ) : null}
    </form>
  );
}
