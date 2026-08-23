"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import {
  toggleItemFavorite,
  toggleOutfitFavorite,
} from "@/lib/feedback/actions";

const INITIAL_FEEDBACK_STATE = { status: "idle", message: "" } as const;

type ItemProps = {
  kind: "item";
  itemId: string;
  isFavorite: boolean;
  compact?: boolean;
};

type OutfitProps = {
  kind: "outfit";
  recommendationId: string;
  slot: number;
  sourceKey?: string;
  isFavorite: boolean;
  compact?: boolean;
};

export function FavoriteButton(props: ItemProps | OutfitProps) {
  const action =
    props.kind === "item" ? toggleItemFavorite : toggleOutfitFavorite;
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_FEEDBACK_STATE,
  );
  const isFavorite =
    state.status === "success" && typeof state.isFavorite === "boolean"
      ? state.isFavorite
      : props.isFavorite;

  return (
    <form action={formAction} className="relative">
      <input
        type="hidden"
        name="intent"
        value={isFavorite ? "remove" : "add"}
      />
      {props.kind === "item" ? (
        <input type="hidden" name="wardrobeItemId" value={props.itemId} />
      ) : (
        <>
          <input
            type="hidden"
            name="recommendationId"
            value={props.recommendationId}
          />
          <input type="hidden" name="slot" value={props.slot} />
          {props.sourceKey ? (
            <input type="hidden" name="sourceKey" value={props.sourceKey} />
          ) : null}
        </>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-label={isFavorite ? "取消收藏" : "收藏"}
        title={state.message || (isFavorite ? "取消收藏" : "收藏")}
        className={`motion-button inline-flex items-center justify-center rounded-full border border-[var(--hairline)] ${
          props.compact ? "size-9" : "h-10 gap-2 px-4 text-xs font-semibold"
        } ${
          isFavorite
            ? "bg-[#1d1d1f] text-white"
            : "bg-[var(--surface-solid)] text-[var(--foreground)]"
        }`}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Heart
            className="size-4"
            fill={isFavorite ? "currentColor" : "none"}
            aria-hidden="true"
          />
        )}
        {props.compact ? null : isFavorite ? "已收藏" : "收藏"}
      </button>
    </form>
  );
}
