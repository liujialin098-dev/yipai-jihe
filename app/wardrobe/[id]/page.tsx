import { ArrowLeft, Heart, ImageOff, Pencil, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WardrobeActionButton } from "@/components/wardrobe/action-button";
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

export default async function WardrobeItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getWardrobeItem(id);
  if (!item) notFound();

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href="/wardrobe"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#514b56]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          返回衣橱
        </Link>
        <Link
          href={`/wardrobe/${item.id}/edit`}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#20202a] px-4 text-xs font-semibold text-white"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          编辑
        </Link>
      </div>

      <section className="mt-3 overflow-hidden rounded-[2rem] border border-black/6 bg-white p-3 shadow-[0_18px_54px_rgba(42,38,54,0.07)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.45rem] bg-[#ebecef]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={`${item.name}的合成演示原图`}
              fill
              sizes="440px"
              unoptimized
              className="object-cover"
              priority
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-[#77717c]">
              <ImageOff className="size-7" aria-hidden="true" />
              原图暂时不可用
            </span>
          )}
        </div>
        <div className="px-2 pt-5 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#776c87]">
                {optionLabel(CATEGORY_OPTIONS, item.category)}
              </p>
              <h1 className="mt-1 font-heading text-[2.1rem] leading-tight font-semibold tracking-[-0.04em] text-[#20202a]">
                {item.name}
              </h1>
            </div>
            <span className="rounded-full bg-[#eeeafe] px-3 py-1.5 text-[0.68rem] font-semibold text-[#5b48c4]">
              {item.status === "archived" ? "已归档" : "使用中"}
            </span>
          </div>
          <p className="mt-3 text-xs text-[#817b85]">
            最近更新{" "}
            {new Intl.DateTimeFormat("zh-CN", {
              month: "short",
              day: "numeric",
            }).format(new Date(item.updated_at))}
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-[1.6rem] border border-black/6 bg-white p-5">
        <h2 className="font-heading text-xl font-semibold text-[#292631]">
          衣物属性
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
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
        <ReadOnlyStatus icon={Heart} label="收藏状态" value="未收藏" />
        <ReadOnlyStatus icon={Sparkles} label="推荐使用" value="尚未用于推荐" />
      </section>

      <section className="mt-5 grid gap-3 rounded-[1.6rem] border border-black/6 bg-white p-4">
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
    <div className={`rounded-xl bg-[#f7f8fa] p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[0.68rem] font-medium text-[#817b85]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#3f3945]">
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
    <div className="rounded-[1.35rem] border border-black/6 bg-white p-4">
      <Icon className="size-4 text-[#725cff]" aria-hidden="true" />
      <p className="mt-4 text-[0.68rem] text-[#817b85]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#3f3945]">{value}</p>
    </div>
  );
}
