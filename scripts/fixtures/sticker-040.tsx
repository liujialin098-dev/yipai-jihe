import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { StickerCanvas } from "../../components/stickers/sticker-canvas";

function Fixture() {
  const [status, setStatus] = useState("未保存");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <main className="mx-auto max-w-md p-5 pb-24">
      <h1>SDD-040 隔离交互样本</h1>
      <p className="text-xs">只在本地内存保存，不连接账号或供应商。</p>
      <output>{status}</output>
      <button
        type="button"
        className="min-h-11 rounded-full px-3"
        onClick={() => setDark(!dark)}
      >
        测试日夜
      </button>
      <StickerCanvas
        day="2026-09-08"
        storageKey="sdd040-isolated-fixture"
        items={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "紫色衣服与测试碎片",
            category: "tops",
            imageUrl: null,
            cutoutUrl: "/image.png",
          },
        ]}
        onRemove={() => setStatus("移除测试已触发")}
        onRefined={() => setStatus("保存成功（隔离测试）")}
      />
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Fixture />);
