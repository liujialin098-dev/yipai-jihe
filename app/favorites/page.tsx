import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "收藏" };

export default function FavoritesPage() {
  return (
    <EmptyState
      eyebrow="收藏 · 00 套"
      icon={Heart}
      title="喜欢的搭配，以后会留在这里。"
      description="收藏依赖真实推荐结果，将随推荐模块在后续阶段接入。现在不会生成占位数据冒充结果。"
    />
  );
}
