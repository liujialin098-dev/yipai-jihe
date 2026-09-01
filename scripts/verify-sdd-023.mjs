import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  readFileSync(resolve(root, relativePath), "utf8");
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`SDD-023 门禁失败：${message}`);
  }
};

const previewPath = "components/recommendations/precision-outfit-preview.tsx";
const cardPath = "components/recommendations/recommendation-card.tsx";
const lookbookPath = "components/recommendations/lookbook-generator.tsx";
const preview = read(previewPath);
const card = read(cardPath);
const lookbook = read(lookbookPath);
const layers = read("lib/recommendations/layers.ts");
const modelPath = resolve(root, "public/virtual-models/neutral-studio.png");

assert(existsSync(resolve(root, previewPath)), "精准预览组件不存在");
assert(
  preview.includes("/virtual-models/neutral-studio.png"),
  "缺少固定人物比例参照",
);
assert(preview.includes("imageUrl"), "精准预览没有复用衣物图片地址");
assert(preview.includes("roleLabel"), "精准预览没有展示衣物角色");
assert(
  preview.includes("不改款、不改色") && preview.includes("整体比例"),
  "精准预览缺少不改款和比例参照说明",
);
assert(
  !preview.includes("fetch(") &&
    !preview.includes("generateRecommendationLookbook"),
  "精准预览不应发起网络或模型请求",
);
assert(
  card.includes("import { PrecisionOutfitPreview }"),
  "推荐卡未接入精准预览组件",
);
assert(
  card.includes("const precisionItems = outfitItems.map"),
  "推荐卡未按当前搭配映射真实衣物",
);
assert(card.includes("<PrecisionOutfitPreview"), "推荐卡未渲染精准预览");
assert(card.includes("AI 效果参考"), "已生成图未明确标记为 AI 效果参考");
assert(card.includes("衣物实拍核对"), "精准预览后未保留实拍核对清单");
assert(
  lookbook.includes("generateRecommendationLookbook"),
  "现有 AI 效果图入口被移除",
);
assert(lookbook.includes("生成虚拟模特效果图"), "现有按需生成入口文案缺失");
assert(layers.includes("OUTFIT_LAYER_LABELS"), "没有复用统一搭配层次定义");
assert(existsSync(modelPath), "固定人物素材不存在");
assert(statSync(modelPath).size > 100_000, "固定人物素材文件异常过小");

console.log("SDD-023 精准原图预览与 AI 可选增强门禁通过。");
