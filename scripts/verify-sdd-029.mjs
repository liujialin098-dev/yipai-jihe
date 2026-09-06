import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as canvas from "../lib/outfits/canvas.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [page, editor, preview, css] = await Promise.all([
  read("app/profile/page.tsx"),
  read("components/profile/profile-editor.tsx"),
  read("components/outfits/outfit-canvas-preview.tsx"),
  read("app/globals.css"),
]);
for (const label of ["衣橱单品", "日记记录", "30 天利用率"])
  assert.ok(page.includes(label));
assert.doesNotMatch(page, /OutfitCanvasPreview|穿搭卡片/);
assert.match(page, /我的收藏/);
assert.match(editor, /<details/);
assert.match(editor, /<summary/);
assert.match(editor, /编辑资料/);
assert.match(editor, /updateProfile/);
assert.match(editor, /URL.revokeObjectURL/);
assert.match(editor, /maxLength=\{20\}/);
assert.match(preview, /hideHeading = false/);
assert.match(preview, /cutoutUrl \?\? wardrobeItem.imageUrl/);
assert.match(preview, /layoutItem.rotation/);
assert.match(
  css,
  /\.app-backdrop\s*\{\s*background: linear-gradient\(165deg, #dfcef8 0%, #eee3fb 42%, #faf7ff 88%\)/,
);
assert.match(css, /\.profile-collection/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(page + editor, /app\.whering|Request to follow|虚拟模特/);
const [recommendations, controls, canvasEditor, cutoutRoute] =
  await Promise.all([
    read("app/recommendations/page.tsx"),
    read("components/recommendations/recommendation-controls.tsx"),
    read("components/outfits/outfit-canvas-editor.tsx"),
    read("app/api/wardrobe/items/[id]/cutout/route.ts"),
  ]);
assert.match(recommendations, /<details/);
assert.match(recommendations, /生成信息/);
assert.doesNotMatch(controls, /单次选择不会覆盖/);
assert.doesNotMatch(canvasEditor, /没有模特，也不会重新画衣服/);
assert.match(cutoutRoute, /feature_retired/);
assert.match(cutoutRoute, /410/);
// 无网络渲染真实 TSX 组件，校验画廊和默认预览的差异。
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(preview, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
new Function("require", "module", "exports", compiled)(
  (name) => (name === "@/lib/outfits/canvas" ? canvas : require(name)),
  module,
  module.exports,
);
const props = {
  title: "固定样本：长标题与三件真实衣物排布",
  theme: "paper",
  compact: true,
  items: [
    {
      wardrobeItemId: "top",
      x: 0.36,
      y: 0.35,
      scale: 1.6,
      rotation: -12,
      zIndex: 1,
    },
    {
      wardrobeItemId: "bottom",
      x: 0.68,
      y: 0.6,
      scale: 1.6,
      rotation: 8,
      zIndex: 2,
    },
    {
      wardrobeItemId: "shoes",
      x: 0.32,
      y: 0.82,
      scale: 1.1,
      rotation: 0,
      zIndex: 3,
    },
  ],
  wardrobeItems: [
    {
      id: "top",
      name: "蓝色衬衫",
      cutoutUrl: "/demo-wardrobe/mist-blue-linen-shirt.webp",
      imageUrl: "/original.jpg",
    },
    {
      id: "bottom",
      name: "牛仔裤",
      cutoutUrl: null,
      imageUrl: "/demo-wardrobe/indigo-straight-jeans.webp",
    },
    { id: "shoes", name: "白色运动鞋", cutoutUrl: null, imageUrl: null },
  ],
};
const render = (input) =>
  renderToStaticMarkup(
    React.createElement(module.exports.OutfitCanvasPreview, input),
  );
const gallery = render({ ...props, hideHeading: true });
const original = render(props);
assert.doesNotMatch(gallery, /<p[ >]/);
assert.match(original, /衣拍即合/);
assert.match(gallery, /rotate\(-12deg\)/);
assert.match(gallery, /蓝色衬衫/);
assert.match(gallery, /白色运动鞋/);
assert.doesNotMatch(gallery, /src="\/original.jpg"/);
assert.match(gallery, /indigo-straight-jeans.webp/);
if (process.argv.includes("--fixture")) {
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(new URL("../.next/", import.meta.url), { recursive: true });
  await writeFile(
    new URL("../.next/sdd029-gallery.json", import.meta.url),
    JSON.stringify({ gallery, original, title: props.title }),
  );
}
console.log(
  "SDD-029 历史预览渲染回归通过；当前个人主页、深浅紫渐变与退役入口按 SDD-030 验收。",
);
