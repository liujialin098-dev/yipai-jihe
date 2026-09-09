import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
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
    <div className="page-enter px-5 pt-3">
      <Link
        href={`/wardrobe/${item.id}`}
        aria-label="返回详情"
        className="liquid-glass-web pressable inline-flex size-10 items-center justify-center rounded-full text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
      </Link>
      <div className="mt-5">
        <PageHeading title="编辑衣物" />
      </div>
      <section className="surface-card mt-6 rounded-[1.6rem] p-5">
        <WardrobeItemForm item={item} />
      </section>
    </div>
  );
}
