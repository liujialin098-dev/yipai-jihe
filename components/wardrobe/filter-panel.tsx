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
  return (
    <section className="mt-5 rounded-[1.5rem] border border-black/6 bg-white p-4 shadow-[0_12px_38px_rgba(42,38,54,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#292631]">
          <SlidersHorizontal
            className="size-4 text-[#725cff]"
            aria-hidden="true"
          />
          查找衣物
        </div>
        <span className="text-xs text-[#7f7984]">{resultCount} 件结果</span>
      </div>
      <form action="/wardrobe" className="mt-4 grid grid-cols-2 gap-3">
        {filters.category ? (
          <input type="hidden" name="category" value={filters.category} />
        ) : null}
        <label className="col-span-2">
          <span className="sr-only">搜索衣物名称</span>
          <span className="flex min-h-11 items-center gap-2 rounded-xl border border-black/9 bg-[#f7f8fa] px-3 focus-within:border-[#725cff] focus-within:ring-2 focus-within:ring-[#725cff]/15">
            <Search className="size-4 text-[#85808a]" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              maxLength={60}
              placeholder="搜索名称"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#292631] outline-none placeholder:text-[#8a858f]"
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
          <span className="text-xs font-medium text-[#5f5965]">状态</span>
          <select
            name="status"
            defaultValue={filters.status}
            className="min-h-11 rounded-xl border border-black/9 bg-[#f7f8fa] px-3 text-sm text-[#292631] outline-none focus:border-[#725cff] focus:ring-2 focus:ring-[#725cff]/15"
          >
            <option value="active">日常衣橱</option>
            <option value="archived">已归档</option>
          </select>
        </label>
        <button
          type="submit"
          className="col-span-2 min-h-11 rounded-xl bg-[#20202a] px-4 text-sm font-semibold text-white transition-transform active:translate-y-px"
        >
          应用条件
        </button>
      </form>
      <a
        href="/wardrobe"
        className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-[#6553d8] underline-offset-4 hover:underline"
      >
        清除全部条件
      </a>
    </section>
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
      <span className="text-xs font-medium text-[#5f5965]">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="min-h-11 rounded-xl border border-black/9 bg-[#f7f8fa] px-3 text-sm text-[#292631] outline-none focus:border-[#725cff] focus:ring-2 focus:ring-[#725cff]/15"
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
