import type { Metadata } from "next";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { OutfitCanvasEditor } from "@/components/outfits/outfit-canvas-editor";
import { getNewOutfitCanvasData } from "@/lib/outfits/data";
import { isUuid } from "@/lib/wardrobe/validation";

export const metadata: Metadata = { title: "新建穿搭卡片" };

export default async function NewOutfitCanvasPage({
  searchParams,
}: {
  searchParams: Promise<{
    recommendationId?: string | string[];
    slot?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const recommendationId =
    typeof params.recommendationId === "string" ? params.recommendationId : "";
  const slot = typeof params.slot === "string" ? Number(params.slot) : 0;
  const data =
    isUuid(recommendationId) && [1, 2, 3].includes(slot)
      ? await getNewOutfitCanvasData(recommendationId, slot)
      : null;

  if (!data) {
    return (
      <div className="page-enter px-5 pt-8">
        <section className="surface-card rounded-[1.75rem] p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#d8ff52] text-[#202124]">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <h1 className="app-section-title mt-4">这套推荐暂时无法编辑</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            推荐可能已经刷新，或其中的衣物不再可用。返回推荐页重新选择一套即可。
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
