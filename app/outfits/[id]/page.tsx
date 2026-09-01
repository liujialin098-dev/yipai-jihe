import type { Metadata } from "next";
import { ArrowLeft, Images } from "lucide-react";
import Link from "next/link";
import { OutfitCanvasEditor } from "@/components/outfits/outfit-canvas-editor";
import { getSavedOutfitCanvasData } from "@/lib/outfits/data";

export const metadata: Metadata = { title: "编辑穿搭卡片" };

export default async function SavedOutfitCanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSavedOutfitCanvasData(id);

  if (!data) {
    return (
      <div className="page-enter px-5 pt-8">
        <section className="surface-card rounded-[1.75rem] p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#afa0ea] text-[#202124]">
            <Images className="size-5" aria-hidden="true" />
          </span>
          <h1 className="app-section-title mt-4">没有找到这张穿搭卡片</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            它可能已被删除，或不属于当前账号。
          </p>
          <Link
            href="/recommendations"
            className="motion-button mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#202124] px-5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回推荐
          </Link>
        </section>
      </div>
    );
  }

  return <OutfitCanvasEditor initialData={data} />;
}
