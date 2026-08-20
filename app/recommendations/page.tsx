import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "推荐" };

export default function RecommendationsPage() {
  return (
    <EmptyState
      eyebrow="推荐 · 等待衣橱"
      icon={Sparkles}
      title="先认识你的衣服，建议才会合身。"
      description="推荐模块将在衣橱和识别能力完成后开放。本阶段不调用 AI，也不会展示虚构搭配。"
    />
  );
}
