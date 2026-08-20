import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "添加衣物" };

export default function AddWardrobeItemPage() {
  return (
    <EmptyState
      eyebrow="下一阶段 · SDD-003"
      icon={ScanLine}
      title="先把私人空间准备好，再拍第一件。"
      description="图片上传、衣物信息和原图保存还没有在本阶段开放。安全底座验收后，这里会成为拍照录入入口。"
    />
  );
}
