"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { savePreferenceQuestionnaire } from "@/app/settings/preferences/actions";
import { OCCASION_OPTIONS, STYLE_OPTIONS } from "@/lib/wardrobe/constants";

const INITIAL_PREFERENCE_STATE = { status: "idle", message: "" } as const;

export function PreferenceForm({
  defaultStyles,
  defaultOccasions,
  defaultFocus,
}: {
  defaultStyles: string[];
  defaultOccasions: string[];
  defaultFocus: string;
}) {
  const [state, action, pending] = useActionState(
    savePreferenceQuestionnaire,
    INITIAL_PREFERENCE_STATE,
  );
  return (
    <form action={action} className="grid gap-5">
      <ChoiceGroup
        legend="1. 你最常穿哪些风格？"
        name="styles"
        options={STYLE_OPTIONS}
        defaults={defaultStyles}
      />
      <ChoiceGroup
        legend="2. 你最常出现在哪些场合？"
        name="occasions"
        options={OCCASION_OPTIONS.filter((option) => option.value !== "sport")}
        defaults={defaultOccasions}
      />
      <fieldset>
        <legend className="text-sm font-semibold">3. 搭配时你更看重？</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["comfort", "舒适"],
            ["versatile", "百搭"],
            ["refined", "精致"],
          ].map(([value, label]) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="focus"
                value={value}
                defaultChecked={value === defaultFocus}
                className="peer sr-only"
              />
              <span className="motion-button flex h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-xs font-semibold peer-checked:bg-[#1d1d1f] peer-checked:text-white">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-[1fr_1.5fr] gap-2">
        <button
          type="submit"
          name="intent"
          value="skip"
          disabled={pending}
          className="motion-button h-12 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-sm font-semibold"
        >
          跳过
        </button>
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={pending}
          className="motion-button flex h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] text-sm font-semibold text-white"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          保存偏好
        </button>
      </div>
      {state.message ? (
        <output
          aria-live="polite"
          className="rounded-[1rem] bg-[var(--system-blue-soft)] px-3.5 py-3 text-xs text-[var(--system-blue)]"
        >
          {state.message}
        </output>
      ) : null}
    </form>
  );
}

function ChoiceGroup({
  legend,
  name,
  options,
  defaults,
}: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  defaults: string[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">可选 1～3 项</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={defaults.includes(option.value)}
              className="peer sr-only"
            />
            <span className="motion-button flex h-10 cursor-pointer items-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-4 text-xs font-semibold peer-checked:bg-[#1d1d1f] peer-checked:text-white">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
