import type { Metadata } from "next";
import { Archive, ArrowRight, SearchX, Shirt } from "lucide-react";
import Link from "next/link";
import { DemoLoader } from "@/components/wardrobe/demo-loader";
import { FilterPanel } from "@/components/wardrobe/filter-panel";
import { WardrobeItemCard } from "@/components/wardrobe/item-card";
import { CATEGORY_OPTIONS } from "@/lib/wardrobe/constants";
import { getWardrobeCount, getWardrobeItems } from "@/lib/wardrobe/data";
import { parseWardrobeFilters } from "@/lib/wardrobe/validation";

export const metadata: Metadata = { title: "衣橱" };

type WardrobePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WardrobePage({
  searchParams,
}: WardrobePageProps) {
  const filters = parseWardrobeFilters(await searchParams);
  const [{ items, error }, activeCount] = await Promise.all([
    getWardrobeItems(filters),
    getWardrobeCount("active"),
  ]);
  const hasFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.color ||
      filters.season ||
      filters.occasion ||
      filters.status === "archived",
  );

  return (
    <div className="px-5 pt-5">
      <header className="closet-grid relative overflow-hidden rounded-[2rem] bg-[#20202a] px-5 pt-5 pb-6 text-white shadow-[0_18px_52px_rgba(32,32,42,0.18)]">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white/55">我的衣橱</p>
            <h1 className="mt-1 font-heading text-[2.2rem] leading-tight font-semibold tracking-[-0.04em]">
              穿过的，也要找得到
            </h1>
          </div>
          <span className="font-heading text-4xl font-semibold tracking-[-0.06em] text-white/80">
            {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <p className="relative z-10 mt-3 max-w-[19rem] text-sm leading-6 text-white/62">
          搜索、筛选和维护都在这里。默认只展示正在使用的衣物。
        </p>
      </header>

      {activeCount > 0 ? (
        <div className="mt-4 flex items-start justify-between gap-4">
          <p className="max-w-[12rem] text-xs leading-5 text-[#77717c]">
            演示数据可重复检查，只会补齐缺失项目。
          </p>
          <DemoLoader compact />
        </div>
      ) : null}

      <nav
        aria-label="衣物类别"
        className="-mx-5 mt-5 overflow-x-auto px-5 pb-1"
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

      {activeCount > 0 || hasFilters ? (
        <FilterPanel filters={filters} resultCount={items.length} />
      ) : null}

      {error ? (
        <WardrobeNotice
          icon={Shirt}
          title="衣橱暂时没有打开"
          description={error}
          action={
            <Link href="/wardrobe" className="font-semibold text-[#6553d8]">
              重新读取
            </Link>
          }
        />
      ) : items.length > 0 ? (
        <section className="mt-5 grid grid-cols-2 gap-3">
          {items.map((item) => (
            <WardrobeItemCard key={item.id} item={item} />
          ))}
        </section>
      ) : !hasFilters ? (
        <section className="mt-5 overflow-hidden rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(42,38,54,0.06)]">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#eeeafe] text-[#725cff]">
            <Shirt className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-10 max-w-[16rem] font-heading text-[2rem] leading-[1.1] font-semibold tracking-[-0.04em] text-[#20202a]">
            先放进一套可用的衣橱
          </h2>
          <p className="mt-3 max-w-[20rem] text-sm leading-6 text-[#6f6b78]">
            一次加载 24 件安全合成衣物，马上体验浏览、筛选和维护。
          </p>
          <div className="mt-6">
            <DemoLoader />
          </div>
        </section>
      ) : (
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
              className="inline-flex items-center gap-1 font-semibold text-[#6553d8]"
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
      className={`inline-flex min-h-9 items-center rounded-full px-4 text-xs font-semibold transition-transform active:translate-y-px ${
        active
          ? "bg-[#20202a] text-white"
          : "border border-black/7 bg-white text-[#6f6974]"
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
    <section className="mt-5 rounded-[1.6rem] border border-black/6 bg-white p-5">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-[#eeeafe] text-[#725cff]">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-[#292631]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#746e79]">{description}</p>
      <div className="mt-4 text-sm">{action}</div>
    </section>
  );
}
