import { Search, SlidersHorizontal } from "lucide-react";
import {
  COLOR_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
} from "@/lib/wardrobe/constants";
import type { WardrobeFilters } from "@/lib/wardrobe/validation";

export function FilterPanel({
  filters,
  resultCount,
}: {
  filters: WardrobeFilters;
  resultCount: number;
}) {
  const hasConfiguredFilters = Boolean(
    filters.q ||
      filters.color ||
      filters.season ||
      filters.occasion ||
      filters.status === "archived",
  );

  return (
    <details
      className="surface-card group mt-5 rounded-[1.5rem] p-4"
      open={hasConfiguredFilters || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl focus-visible:outline-2 focus-visible:outline-[var(--system-blue)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <SlidersHorizontal
            className="size-4 text-[var(--system-blue)]"
            aria-hidden="true"
          />
          搜索与筛选
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {resultCount} 件结果
        </span>
      </summary>
      <form action="/wardrobe" className="mt-4 grid grid-cols-2 gap-3">
        {filters.category ? (
          <input type="hidden" name="category" value={filters.category} />
        ) : null}
        <label className="col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            衣物名称
          </span>
          <span className="flex min-h-11 items-center gap-2 rounded-[0.9rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 focus-within:border-[var(--system-blue)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--system-blue)_18%,transparent)]">
            <Search
              className="size-4 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              maxLength={60}
              placeholder="例如：针织"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </span>
        </label>
        <FilterSelect
          label="主色"
          name="color"
          value={filters.color}
          options={COLOR_OPTIONS}
        />
        <FilterSelect
          label="季节"
          name="season"
          value={filters.season}
          options={SEASON_OPTIONS}
        />
        <FilterSelect
          label="场合"
          name="occasion"
          value={filters.occasion}
          options={OCCASION_OPTIONS}
        />
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            状态
          </span>
          <select
            name="status"
            defaultValue={filters.status}
            className="min-h-11 rounded-[0.9rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--system-blue)_18%,transparent)]"
          >
            <option value="active">日常衣橱</option>
            <option value="archived">已归档</option>
          </select>
        </label>
        <button
          type="submit"
          className="pressable col-span-2 min-h-11 rounded-full bg-[var(--control-primary)] px-4 text-sm font-semibold text-[var(--control-primary-foreground)]"
        >
          应用条件
        </button>
      </form>
      <a
        href="/wardrobe"
        className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-[var(--system-blue)] underline-offset-4 hover:underline"
      >
        清除全部条件
      </a>
    </details>
  );
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="min-h-11 rounded-[0.9rem] border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--system-blue)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--system-blue)_18%,transparent)]"
      >
        <option value="">不限</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
