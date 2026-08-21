"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";
import { updateWardrobeItem } from "@/app/wardrobe/actions";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/wardrobe/constants";
import type { WardrobeItem } from "@/lib/wardrobe/data";
import { INITIAL_ACTION_STATE } from "@/lib/wardrobe/validation";

export function WardrobeItemForm({ item }: { item: WardrobeItem }) {
  const updateAction = updateWardrobeItem.bind(null, item.id);
  const [state, formAction, pending] = useActionState(
    updateAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <Field
        label="衣物名称"
        htmlFor="wardrobe-name"
        error={state.fieldErrors?.name?.[0]}
      >
        <input
          id="wardrobe-name"
          name="name"
          defaultValue={item.name}
          maxLength={60}
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className="min-h-12 w-full rounded-xl border border-black/10 bg-[#f7f8fa] px-3.5 text-sm text-[#292631] outline-none placeholder:text-[#8a858f] focus:border-[#725cff] focus:ring-2 focus:ring-[#725cff]/15"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="类别"
          name="category"
          value={item.category}
          options={CATEGORY_OPTIONS}
          error={state.fieldErrors?.category?.[0]}
        />
        <SelectField
          label="主色"
          name="primary_color"
          value={item.primary_color}
          options={COLOR_OPTIONS}
          error={state.fieldErrors?.primary_color?.[0]}
        />
        <SelectField
          label="材质"
          name="material"
          value={item.material}
          options={MATERIAL_OPTIONS}
          error={state.fieldErrors?.material?.[0]}
        />
        <SelectField
          label="风格"
          name="style"
          value={item.style}
          options={STYLE_OPTIONS}
          error={state.fieldErrors?.style?.[0]}
        />
      </div>
      <CheckboxField
        label="适用季节"
        name="seasons"
        selected={item.seasons}
        options={SEASON_OPTIONS}
        error={state.fieldErrors?.seasons?.[0]}
      />
      <CheckboxField
        label="适用场合"
        name="occasions"
        selected={item.occasions}
        options={OCCASION_OPTIONS}
        error={state.fieldErrors?.occasions?.[0]}
      />
      {state.message ? (
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error" ? "text-[#a53f35]" : "text-[#4d745e]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#20202a] px-5 text-sm font-semibold text-white transition-transform active:translate-y-px disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        {pending ? "正在保存" : "保存修改"}
      </button>
    </form>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#3f3945]">
        {label}
      </label>
      {children}
      {error ? <span className="text-xs text-[#a53f35]">{error}</span> : null}
    </div>
  );
}

function SelectField({
  error,
  label,
  name,
  options,
  value,
}: {
  error?: string;
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
}) {
  return (
    <Field label={label} htmlFor={`wardrobe-${name}`} error={error}>
      <select
        id={`wardrobe-${name}`}
        name={name}
        defaultValue={value}
        aria-invalid={Boolean(error)}
        className="min-h-12 w-full rounded-xl border border-black/10 bg-[#f7f8fa] px-3 text-sm text-[#292631] outline-none focus:border-[#725cff] focus:ring-2 focus:ring-[#725cff]/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CheckboxField({
  error,
  label,
  name,
  options,
  selected,
}: {
  error?: string;
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-[#3f3945]">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-black/8 bg-[#f7f8fa] px-3 text-sm text-[#514b56] has-checked:border-[#725cff]/35 has-checked:bg-[#eeeafe] has-checked:text-[#4736a1]"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.includes(option.value)}
              className="size-4 accent-[#725cff]"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? <p className="text-xs text-[#a53f35]">{error}</p> : null}
    </fieldset>
  );
}
