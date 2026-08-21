import type { Metadata } from "next";
import { Archive, ArrowRight, SearchX, Shirt } from "lucide-react";
import Link from "next/link";
import { DemoLoader } from "@/components/wardrobe/demo-loader";
import { FilterPanel } from "@/components/wardrobe/filter-panel";
import { WardrobeItemCard } from "@/components/wardrobe/item-card";
import { CATEGORY_OPTIONS } from "@/lib/wardrobe/constants";
import { getWardrobeItems } from "@/lib/wardrobe/data";
import { parseWardrobeFilters } from "@/lib/wardrobe/validation";

export const metadata: Metadata = { title: "衣橱" };

type WardrobePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WardrobePage({
  searchParams,
}: WardrobePageProps) {
  const filters = parseWardrobeFilters(await searchParams);
  const { items, error } = await getWardrobeItems(filters);
  const hasFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.color ||
      filters.season ||
      filters.occasion ||
      filters.status === "archived",
  );
  const hasWardrobeContext = items.length > 0 || hasFilters;

  return (
    <div className="page-enter px-5 pt-4">
      <header>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[var(--system-blue)]">
              我的衣橱
            </p>
            <h1 className="mt-2 font-heading text-[2.85rem] leading-none font-bold tracking-[-0.07em] text-[var(--foreground)]">
              所有衣物
            </h1>
          </div>
          <span className="font-heading text-[2rem] font-bold tracking-[-0.06em] text-[var(--text-tertiary)]">
            {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-3 max-w-[21rem] text-sm leading-6 text-[var(--text-secondary)]">
          分类浏览、组合筛选和单品维护都在这里。
        </p>
      </header>

      {!error ? (
        <section
          className={
            hasWardrobeContext
              ? "mt-5 flex items-start justify-between gap-4 border-t border-[var(--hairline)] pt-4"
              : "surface-card mt-6 overflow-hidden rounded-[1.75rem] p-6"
          }
        >
          {hasWardrobeContext ? (
            <p className="max-w-[11rem] text-xs leading-5 text-[var(--text-tertiary)]">
              演示数据可重复检查，只会补齐缺失项目。
            </p>
          ) : (
            <div>
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
                <Shirt className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-12 max-w-[18rem] font-heading text-[2.25rem] leading-[1.06] font-bold tracking-[-0.06em] text-[var(--foreground)]">
                先放进一套可用的衣橱
              </h2>
              <p className="mt-3 mb-6 max-w-[20rem] text-sm leading-6 text-[var(--text-secondary)]">
                一次加载 24 件安全合成衣物，马上体验浏览、筛选和维护。
              </p>
            </div>
          )}
          <DemoLoader compact={hasWardrobeContext} />
        </section>
      ) : null}

      <nav
        aria-label="衣物类别"
        className="hide-scrollbar -mx-5 mt-6 overflow-x-auto px-5 pb-1"
      >
        <div className="flex w-max gap-2">
          <CategoryLink
            label="全部"
            active={!filters.category}
            filters={filters}
          />
          {CATEGORY_OPTIONS.map((option) => (
            <CategoryLink
              key={option.value}
              label={option.label}
              value={option.value}
              active={filters.category === option.value}
              filters={filters}
            />
          ))}
        </div>
      </nav>

      {hasWardrobeContext ? (
        <FilterPanel filters={filters} resultCount={items.length} />
      ) : null}

      {error ? (
        <WardrobeNotice
          icon={Shirt}
          title="衣橱暂时没有打开"
          description={error}
          action={
            <Link
              href="/wardrobe"
              className="font-semibold text-[var(--system-blue)]"
            >
              重新读取
            </Link>
          }
        />
      ) : items.length > 0 ? (
        <section className="mt-5 grid grid-cols-2 gap-3">
          {items.map((item, index) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              eager={index < 2}
              index={index}
            />
          ))}
        </section>
      ) : !hasFilters ? null : (
        <WardrobeNotice
          icon={filters.status === "archived" ? Archive : SearchX}
          title={
            filters.status === "archived" ? "还没有归档衣物" : "没有匹配的衣物"
          }
          description={
            filters.status === "archived"
              ? "归档后的衣物会在这里集中显示，并且随时可以恢复。"
              : "当前条件没有结果。清除条件后可以回到完整日常衣橱。"
          }
          action={
            <Link
              href="/wardrobe"
              className="inline-flex items-center gap-1 font-semibold text-[var(--system-blue)]"
            >
              回到日常衣橱
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
      )}
    </div>
  );
}

function CategoryLink({
  active,
  filters,
  label,
  value,
}: {
  active: boolean;
  filters: ReturnType<typeof parseWardrobeFilters>;
  label: string;
  value?: string;
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.color) params.set("color", filters.color);
  if (filters.season) params.set("season", filters.season);
  if (filters.occasion) params.set("occasion", filters.occasion);
  if (filters.status !== "active") params.set("status", filters.status);
  if (value) params.set("category", value);
  const query = params.toString();

  return (
    <Link
      href={query ? `/wardrobe?${query}` : "/wardrobe"}
      aria-current={active ? "page" : undefined}
      className={`pressable inline-flex min-h-9 items-center rounded-full px-4 text-xs font-semibold ${
        active
          ? "bg-[#1d1d1f] text-white shadow-[0_8px_20px_rgba(29,29,31,0.16)]"
          : "border border-[var(--hairline)] bg-[var(--surface)] text-[var(--text-secondary)]"
      }`}
    >
      {label}
    </Link>
  );
}

function WardrobeNotice({
  action,
  description,
  icon: Icon,
  title,
}: {
  action: React.ReactNode;
  description: string;
  icon: typeof Shirt;
  title: string;
}) {
  return (
    <section className="surface-card mt-5 rounded-[1.5rem] p-5">
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <h2 className="mt-7 font-heading text-2xl font-bold tracking-[-0.045em] text-[var(--foreground)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      <div className="mt-4 text-sm">{action}</div>
    </section>
  );
}
