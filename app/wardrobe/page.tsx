import type { Metadata } from "next";
import { Archive, ArrowRight, SearchX, Shirt } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { DemoLoader } from "@/components/wardrobe/demo-loader";
import { FilterPanel } from "@/components/wardrobe/filter-panel";
import { WardrobeItemCard } from "@/components/wardrobe/item-card";
import { getViewer } from "@/lib/auth/viewer";
import { DEMO_WARDROBE } from "@/lib/wardrobe/catalog";
import { CATEGORY_OPTIONS } from "@/lib/wardrobe/constants";
import { getWardrobeComposition, getWardrobeItems } from "@/lib/wardrobe/data";
import { parseWardrobeFilters } from "@/lib/wardrobe/validation";

export const metadata: Metadata = { title: "衣橱" };

type WardrobePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WardrobePage({
  searchParams,
}: WardrobePageProps) {
  const filters = parseWardrobeFilters(await searchParams);
  const [{ items, error }, viewer, composition] = await Promise.all([
    getWardrobeItems(filters),
    getViewer(),
    getWardrobeComposition(),
  ]);
  const hasFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.color ||
      filters.season ||
      filters.occasion ||
      filters.status === "archived",
  );
  const hasWardrobeContext = items.length > 0 || hasFilters;
  const canLoadDemo =
    !error &&
    !composition.error &&
    viewer?.isAnonymous === true &&
    composition.realCount === 0 &&
    composition.demoCount < DEMO_WARDROBE.length;
  const isPartialDemo = canLoadDemo && composition.demoCount > 0;
  const showEmptyState = !error && items.length === 0 && !hasFilters;

  return (
    <div className="page-enter px-5 pt-4">
      <PageHeading title="衣橱">
        <p className="app-page-meta">{items.length} 件</p>
      </PageHeading>

      {showEmptyState ? (
        <section className="surface-card mt-6 overflow-hidden rounded-[1.75rem] p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
            <Shirt className="size-5" aria-hidden="true" />
          </span>
          <h2 className="app-section-title mt-8">
            {isPartialDemo ? "演示衣橱还没加载完整" : "衣橱还是空的"}
          </h2>
          <p className="mt-3 max-w-[20rem] text-sm leading-6 text-[var(--text-secondary)]">
            {canLoadDemo
              ? isPartialDemo
                ? `已有 ${composition.demoCount} 件演示衣物，可继续加载缺失部分。`
                : `可先加载 ${DEMO_WARDROBE.length} 件演示衣物体验完整流程，也可以直接添加自己的衣物。`
              : "添加第一件自己的衣物后，就能开始整理衣橱和生成搭配。"}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canLoadDemo ? <DemoLoader compact={isPartialDemo} /> : null}
            <Link
              href="/wardrobe/new"
              className={
                canLoadDemo && !isPartialDemo
                  ? "pressable inline-flex min-h-11 items-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-5 text-sm font-semibold text-[var(--foreground)]"
                  : "pressable inline-flex min-h-11 items-center rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(29,29,31,0.2)]"
              }
            >
              添加自己的衣物
            </Link>
          </div>
        </section>
      ) : isPartialDemo ? (
        <section className="mt-5 flex items-start justify-between gap-4 border-t border-[var(--hairline)] pt-4">
          <p className="max-w-[12rem] text-xs leading-5 text-[var(--text-tertiary)]">
            演示衣橱尚未完整，可继续加载缺失的衣物。
          </p>
          <DemoLoader compact />
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
      <h2 className="app-section-title mt-7">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      <div className="mt-4 text-sm">{action}</div>
    </section>
  );
}
