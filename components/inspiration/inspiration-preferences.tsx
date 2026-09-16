"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { saveFashionPreferences } from "@/app/inspiration/actions";
import {
  FASHION_TOPICS,
  FASHION_TOPIC_LABELS,
  type FashionPreferences,
  type FashionTopic,
} from "@/lib/inspiration/validation";

export function InspirationPreferences({
  preferences,
}: {
  preferences: FashionPreferences;
}) {
  const [topics, setTopics] = useState<FashionTopic[]>(preferences.topics);
  const [personalized, setPersonalized] = useState(preferences.personalized);
  const [unreadEnabled, setUnreadEnabled] = useState(preferences.unreadEnabled);
  const [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState(
    async (previous: { ok: boolean; message: string }, formData: FormData) => {
      try {
        const result = await saveFashionPreferences(previous, formData);
        setDirty(false);
        return result;
      } catch {
        setDirty(false);
        return { ok: false, message: "暂时无法保存，当前选择已保留，请重试。" };
      }
    },
    {
      ok: false,
      message: "",
    },
  );
  return (
    <details className="surface-card mt-5 rounded-[1.5rem] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-semibold text-[var(--foreground)]">
            调整灵感偏好
          </span>
        </span>
        <SlidersHorizontal
          className="size-4 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
      </summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          // Dispatch explicitly: form actions reset checkboxes even on a handled error.
          startTransition(() => action(formData));
        }}
        className="mt-5 border-t border-[var(--hairline)] pt-4"
      >
        <fieldset disabled={pending}>
          <legend className="w-full text-center text-xs font-semibold text-[var(--foreground)]">
            感兴趣主题
          </legend>
          <div className="inspiration-topic-grid">
            {FASHION_TOPICS.map((topic) => (
              <label key={topic} className="inspiration-topic-option">
                <input
                  type="checkbox"
                  name="topics"
                  value={topic}
                  checked={topics.includes(topic)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setTopics((current) =>
                      checked
                        ? [...current, topic]
                        : current.filter((value) => value !== topic),
                    );
                    setDirty(true);
                  }}
                  className="inspiration-topic-input"
                />
                <span className="inspiration-topic-chip">
                  <Check
                    className="inspiration-topic-check"
                    aria-hidden="true"
                  />
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
            checked={personalized}
            disabled={pending}
            onChange={(checked) => {
              setPersonalized(checked);
              setDirty(true);
            }}
          />
          <PreferenceToggle
            name="unreadEnabled"
            label="在 App 内显示未读提示"
            checked={unreadEnabled}
            disabled={pending}
            onChange={(checked) => {
              setUnreadEnabled(checked);
              setDirty(true);
            }}
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
          {dirty ? "有未保存的修改" : state.message}
        </output>
      </form>
    </details>
  );
}

function PreferenceToggle({
  name,
  label,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-[1rem] bg-[var(--surface-soft)] px-3.5">
      <span className="text-xs font-medium text-[var(--foreground)]">
        {label}
      </span>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-4 accent-[var(--system-blue)]"
      />
    </label>
  );
}
