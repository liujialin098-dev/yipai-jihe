import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "添加衣物" };

export default function AddWardrobeItemPage() {
  return (
    <EmptyState
      eyebrow="下一阶段"
      icon={ScanLine}
      title="拍照识别，会从这里开始。"
      description="当前可以先用演示衣橱体验管理流程。拍照、相册选择和 AI 属性识别将在下一阶段开放。"
    />
  );
}
