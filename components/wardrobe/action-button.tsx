"use client";

import { Archive, ArchiveRestore, LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import {
  archiveWardrobeItem,
  deleteWardrobeItem,
  restoreWardrobeItem,
} from "@/app/wardrobe/actions";
import {
  type ActionState,
  INITIAL_ACTION_STATE,
} from "@/lib/wardrobe/validation";

type Mode = "archive" | "restore" | "delete";
type BoundAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

const CONTENT = {
  archive: { label: "归档衣物", pending: "正在归档", icon: Archive },
  restore: { label: "恢复衣物", pending: "正在恢复", icon: ArchiveRestore },
  delete: { label: "永久删除", pending: "正在删除", icon: Trash2 },
} as const;

export function WardrobeActionButton({
  itemId,
  mode,
}: {
  itemId: string;
  mode: Mode;
}) {
  const action = (
    mode === "archive"
      ? archiveWardrobeItem.bind(null, itemId)
      : mode === "restore"
        ? restoreWardrobeItem.bind(null, itemId)
        : deleteWardrobeItem.bind(null, itemId)
  ) as BoundAction;
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const content = CONTENT[mode];
  const Icon = content.icon;

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            mode === "delete" &&
            !window.confirm(
              "永久删除后，衣物记录和原图都无法恢复。确认删除吗？",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform active:translate-y-px disabled:opacity-60 ${
            mode === "delete"
              ? "border border-[#c94f43]/20 bg-[#fff0ed] text-[#a53f35]"
              : "border border-black/8 bg-white text-[#3f3945]"
          }`}
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className="size-4" aria-hidden="true" />
          )}
          {pending ? content.pending : content.label}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-2 text-xs leading-5 ${
            state.status === "error" ? "text-[#a53f35]" : "text-[#4d745e]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
