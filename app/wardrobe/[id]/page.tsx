import { ArrowLeft, Heart, ImageOff, Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { WardrobeActionButton } from "@/components/wardrobe/action-button";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import { wardrobeAudienceLabel } from "@/lib/personalization/constants";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  OCCASION_OPTIONS,
  optionLabel,
  SEASON_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/wardrobe/constants";
import { getWardrobeItem } from "@/lib/wardrobe/data";
import { createClient } from "@/lib/supabase/server";

export default async function WardrobeItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, supabase] = await Promise.all([
    getWardrobeItem(id),
    createClient(),
  ]);
  if (!item) notFound();
  const favoriteResult = await supabase
    .from("wardrobe_item_favorites")
    .select("id")
    .eq("wardrobe_item_id", item.id)
    .maybeSingle();

  return (
    <div className="page-enter px-5 pt-3">
      <div className="flex items-center justify-between">
        <Link
          href="/wardrobe"
          aria-label="返回衣橱"
          className="liquid-glass-web pressable inline-flex size-10 items-center justify-center rounded-full text-[var(--foreground)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href={`/wardrobe/${item.id}/edit`}
          className="pressable inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--control-primary)] px-4 text-xs font-semibold text-[var(--control-primary-foreground)] shadow-[0_10px_24px_rgba(29,29,31,0.18)]"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          编辑
        </Link>
      </div>

      <section className="surface-card mt-4 overflow-hidden rounded-[1.75rem] p-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-[var(--surface-soft)]">
          {item.cutoutUrl || item.imageUrl ? (
            <GarmentSticker
              imageUrl={item.imageUrl}
              cutoutUrl={item.cutoutUrl}
              alt={`${item.name}${item.demo_key ? "的演示棚拍图" : "的原图"}`}
              sizes="440px"
              eager
              className="size-full rounded-[1.4rem]"
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]">
              <ImageOff className="size-7" aria-hidden="true" />
              原图暂时不可用
            </span>
          )}
        </div>
        <div className="px-2 pt-5 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="app-page-meta">
                {optionLabel(CATEGORY_OPTIONS, item.category)}
              </p>
              <h1 className="app-page-title mt-1">{item.name}</h1>
            </div>
            <span className="rounded-full bg-[var(--system-blue-soft)] px-3 py-1.5 text-[0.68rem] font-semibold text-[var(--system-blue)]">
              {item.status === "archived" ? "已归档" : "使用中"}
            </span>
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            最近更新{" "}
            {new Intl.DateTimeFormat("zh-CN", {
              month: "short",
              day: "numeric",
            }).format(new Date(item.updated_at))}
          </p>
        </div>
      </section>

      <section className="surface-card mt-5 rounded-[1.5rem] p-5">
        <h2 className="app-section-title">衣物属性</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Attribute label="品牌" value={item.brand ?? "未填写"} />
          <Attribute
            label="主色"
            value={optionLabel(COLOR_OPTIONS, item.primary_color)}
          />
          <Attribute
            label="材质"
            value={optionLabel(MATERIAL_OPTIONS, item.material)}
          />
          <Attribute
            label="风格"
            value={optionLabel(STYLE_OPTIONS, item.style)}
          />
          <Attribute
            label="衣着归属"
            value={wardrobeAudienceLabel(item.audience)}
          />
          <Attribute
            label="适用季节"
            value={item.seasons
              .map((value) => optionLabel(SEASON_OPTIONS, value))
              .join("、")}
          />
          <Attribute
            label="适用场合"
            value={item.occasions
              .map((value) => optionLabel(OCCASION_OPTIONS, value))
              .join("、")}
            wide
          />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="surface-card rounded-[1.4rem] p-4">
          <Heart
            className="size-4 text-[var(--system-blue)]"
            aria-hidden="true"
          />
          <p className="mt-5 text-[0.68rem] text-[var(--text-tertiary)]">
            收藏状态
          </p>
          <div className="mt-2">
            <FavoriteButton
              kind="item"
              itemId={item.id}
              isFavorite={Boolean(favoriteResult.data)}
            />
          </div>
        </div>
        <ReadOnlyStatus icon={Sparkles} label="推荐使用" value="尚未用于推荐" />
      </section>

      <section className="surface-card mt-5 grid gap-3 rounded-[1.5rem] p-4">
        <WardrobeActionButton
          itemId={item.id}
          mode={item.status === "archived" ? "restore" : "archive"}
        />
        <WardrobeActionButton itemId={item.id} mode="delete" />
      </section>
    </div>
  );
}

function Attribute({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[1rem] bg-[var(--surface-soft)] p-3 ${wide ? "col-span-2" : ""}`}
    >
      <p className="text-[0.68rem] font-medium text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function ReadOnlyStatus({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card rounded-[1.4rem] p-4">
      <Icon className="size-4 text-[var(--system-blue)]" aria-hidden="true" />
      <p className="mt-5 text-[0.68rem] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
