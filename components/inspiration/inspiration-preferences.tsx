"use client";

import { SlidersHorizontal } from "lucide-react";
import { useActionState } from "react";
import { saveFashionPreferences } from "@/app/inspiration/actions";
import {
  FASHION_TOPICS,
  FASHION_TOPIC_LABELS,
  type FashionPreferences,
} from "@/lib/inspiration/validation";

export function InspirationPreferences({
  preferences,
}: {
  preferences: FashionPreferences;
}) {
  const [state, action, pending] = useActionState(saveFashionPreferences, {
    ok: false,
    message: "",
  });
  return (
    <details className="surface-card mt-5 rounded-[1.5rem] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-semibold text-[var(--foreground)]">
            调整灵感偏好
          </span>
          <span className="mt-1 block text-xs text-[var(--text-secondary)]">
            主题、个性化与未读提示都可撤销
          </span>
        </span>
        <SlidersHorizontal
          className="size-4 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
      </summary>
      <form
        action={action}
        className="mt-5 border-t border-[var(--hairline)] pt-4"
      >
        <fieldset>
          <legend className="text-xs font-semibold text-[var(--foreground)]">
            感兴趣主题
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {FASHION_TOPICS.map((topic) => (
              <label key={topic} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="topics"
                  value={topic}
                  defaultChecked={preferences.topics.includes(topic)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center rounded-full border border-[var(--hairline)] bg-[var(--surface-soft)] px-3.5 text-xs font-semibold text-[var(--text-secondary)] peer-checked:border-[var(--control-primary)] peer-checked:bg-[var(--control-primary)] peer-checked:text-[var(--control-primary-foreground)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                  {FASHION_TOPIC_LABELS[topic]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-2">
          <PreferenceToggle
            name="personalized"
            label="结合我的衣橱和风格排序"
            defaultChecked={preferences.personalized}
          />
          <PreferenceToggle
            name="unreadEnabled"
            label="在 App 内显示未读提示"
            defaultChecked={preferences.unreadEnabled}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="motion-button mt-4 h-11 w-full rounded-full bg-[var(--control-primary)] text-sm font-semibold text-[var(--control-primary-foreground)]"
        >
          {pending ? "正在保存…" : "保存内容偏好"}
        </button>
        <output className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
          {state.message}
        </output>
      </form>
    </details>
  );
}

function PreferenceToggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-[1rem] bg-[var(--surface-soft)] px-3.5">
      <span className="text-xs font-medium text-[var(--foreground)]">
        {label}
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-[var(--system-blue)]"
      />
    </label>
  );
}
