"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";
import { updateWardrobeItem } from "@/app/wardrobe/actions";
import { WARDROBE_AUDIENCE_OPTIONS } from "@/lib/personalization/constants";
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
          className="min-h-12 w-full rounded-[0.95rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--system-blue)_18%,transparent)]"
        />
      </Field>
      <Field
        label="品牌（可选）"
        htmlFor="wardrobe-brand"
        error={state.fieldErrors?.brand?.[0]}
      >
        <input
          id="wardrobe-brand"
          name="brand"
          defaultValue={item.brand ?? ""}
          maxLength={40}
          placeholder="没有清晰品牌可留空"
          aria-invalid={Boolean(state.fieldErrors?.brand)}
          className="min-h-12 w-full rounded-[0.95rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--system-blue)_18%,transparent)]"
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
        <SelectField
          label="衣着归属"
          name="audience"
          value={item.audience}
          options={WARDROBE_AUDIENCE_OPTIONS}
          error={state.fieldErrors?.audience?.[0]}
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
            state.status === "error"
              ? "text-[var(--danger-text)]"
              : "text-[var(--success-text)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)] shadow-[0_12px_26px_rgba(29,29,31,0.18)] disabled:opacity-60"
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
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-[var(--foreground)]"
      >
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-[var(--danger-text)]">{error}</span>
      ) : null}
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
        className="min-h-12 w-full rounded-[0.95rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--system-blue)_18%,transparent)]"
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
      <legend className="text-sm font-semibold text-[var(--foreground)]">
        {label}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 items-center gap-2 rounded-[0.9rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--text-secondary)] has-checked:border-[var(--system-blue)]/35 has-checked:bg-[var(--system-blue-soft)] has-checked:text-[var(--system-blue)]"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.includes(option.value)}
              className="size-4 accent-[var(--system-blue)]"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-xs text-[var(--danger-text)]">{error}</p>
      ) : null}
    </fieldset>
  );
}
