import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WardrobeItemForm } from "@/components/wardrobe/item-form";
import { getWardrobeItem } from "@/lib/wardrobe/data";

export default async function EditWardrobeItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getWardrobeItem(id);
  if (!item) notFound();

  return (
    <div className="px-5 pt-4">
      <Link
        href={`/wardrobe/${item.id}`}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#514b56]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        返回详情
      </Link>
      <header className="mt-4">
        <p className="text-xs font-medium text-[#776c87]">编辑衣物</p>
        <h1 className="mt-1 font-heading text-[2.25rem] leading-tight font-semibold tracking-[-0.04em] text-[#20202a]">
          校准这件衣物的信息
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#746e79]">
          本阶段只修改文字属性，原图会保持不变。
        </p>
      </header>
      <section className="mt-5 rounded-[1.7rem] border border-black/6 bg-white p-5 shadow-[0_16px_46px_rgba(42,38,54,0.06)]">
        <WardrobeItemForm item={item} />
      </section>
    </div>
  );
}
