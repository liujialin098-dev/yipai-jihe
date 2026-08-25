"use client";

import { LoaderCircle, MapPin, Shirt, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { savePreferenceQuestionnaire } from "@/app/settings/preferences/actions";
import { CLOTHING_PREFERENCE_OPTIONS } from "@/lib/personalization/constants";
import { OCCASION_OPTIONS, STYLE_OPTIONS } from "@/lib/wardrobe/constants";

const INITIAL_PREFERENCE_STATE = { status: "idle", message: "" } as const;

export function PreferenceForm({
  defaultStyles,
  defaultOccasions,
  defaultFocus,
  defaultCity,
  defaultAdmin1,
  defaultClothingPreference,
}: {
  defaultStyles: string[];
  defaultOccasions: string[];
  defaultFocus: string;
  defaultCity: string;
  defaultAdmin1: string;
  defaultClothingPreference: string;
}) {
  const [state, action, pending] = useActionState(
    savePreferenceQuestionnaire,
    INITIAL_PREFERENCE_STATE,
  );
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="preference-city" className="text-sm font-semibold">
          常用城市
        </label>
        <div className="field-control flex min-h-12 items-center gap-3 rounded-[1rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3.5 focus-within:border-[var(--system-blue)]">
          <MapPin
            className="size-4 shrink-0 text-[var(--system-blue)]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="preference-city"
            name="city"
            defaultValue={defaultCity}
            maxLength={40}
            placeholder="例如武汉"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">
          {defaultCity
            ? `当前使用${defaultAdmin1 ? `${defaultAdmin1} · ` : ""}${defaultCity}，保存后同步到账号。`
            : "用于当地天气。只保存城市级位置，不会持续定位。"}
        </p>
      </div>

      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-semibold">
          <Shirt
            className="size-4 text-[var(--system-blue)]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          衣着偏好
        </legend>
        <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
          只影响展示和推荐，不会删除衣物。
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {CLOTHING_PREFERENCE_OPTIONS.map((option) => (
            <label key={option.value} className="relative">
              <input
                type="radio"
                name="clothingPreference"
                value={option.value}
                defaultChecked={option.value === defaultClothingPreference}
                className="peer sr-only"
              />
              <span className="motion-button flex h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-xs font-semibold peer-checked:border-[#1d1d1f] peer-checked:bg-[#1d1d1f] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--system-blue)]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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
