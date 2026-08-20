import type { Metadata } from "next";
import { Shirt } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "衣橱" };

export default function WardrobePage() {
  return (
    <EmptyState
      eyebrow="衣橱 · 00 件"
      icon={Shirt}
      title="你的衣橱，还在等第一件衣服。"
      description="本阶段先确保每个人只看到自己的空间。衣物录入和列表会在 SDD-003 开放。"
      action={
        <Link
          href="/wardrobe/new"
          className="inline-flex rounded-full bg-[#20202a] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#725cff]"
        >
          了解添加流程
        </Link>
      }
    />
  );
}
