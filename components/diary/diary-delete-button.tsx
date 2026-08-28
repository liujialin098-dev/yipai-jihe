"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteDiaryEntry } from "@/app/diary/actions";
import { INITIAL_DIARY_ACTION_STATE } from "@/lib/diary/validation";

export function DiaryDeleteButton({ entryId }: { entryId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteDiaryEntry,
    INITIAL_DIARY_ACTION_STATE,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("确认删除这天的穿搭记录吗？衣物不会被删除。")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="entryId" value={entryId} />
        <button
          type="submit"
          disabled={pending}
          className="motion-button inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#c9342f] disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle
              className="size-3.5 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
          {pending ? "删除中" : "删除"}
        </button>
      </form>
      {state.status === "error" ? (
        <p aria-live="polite" className="mt-1 text-xs text-[#c9342f]">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
