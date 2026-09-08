import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const component = await read("components/wardrobe/garment-sticker.tsx");
assert.match(component, /cutoutUrl \?\? imageUrl/);
assert.match(component, /data-sticker-mode=\{mode\}/);
assert.match(component, /mode === "cutout"/);
assert.match(component, /garment-sticker-outline/);
assert.match(component, /aria-hidden="true"/);
assert.match(component, /garment-sticker-image/);
assert.doesNotMatch(component, /fetch\(|canvas|professional-cutout|BAIDU_/);

for (const path of [
  "components/wardrobe/item-card.tsx",
  "components/recommendations/recommendation-card.tsx",
  "components/recommendations/replace-item-panel.tsx",
]) {
  const source = await read(path);
  assert.match(source, /GarmentSticker/);
  assert.match(source, /cutoutUrl=/);
  assert.match(source, /imageUrl=/);
}

const recommendation = await read(
  "components/recommendations/recommendation-card.tsx",
);
for (const preservedAction of [
  "FavoriteButton",
  "ReplaceItemPanel",
  "RecommendationDiaryButton",
]) {
  assert.match(recommendation, new RegExp(preservedAction));
}
assert.doesNotMatch(recommendation, /OutfitCanvasPreview|virtual-model|抠图/);

const css = await read("app/globals.css");
for (const selector of [
  ".garment-sticker",
  ".garment-sticker::before",
  ".garment-sticker-outline",
  'data-sticker-mode="cutout"',
  'data-sticker-mode="photo"',
  "repeating-linear-gradient",
  "mask-origin: content-box",
  "prefers-reduced-motion",
  "prefers-reduced-transparency",
]) {
  assert.ok(css.includes(selector), `缺少贴纸视觉边界：${selector}`);
}
assert.doesNotMatch(css, /garment-sticker[^}]*rgb\(0 0 0/);

for (const path of [
  "components/wardrobe/garment-sticker.tsx",
  "components/wardrobe/item-card.tsx",
  "components/recommendations/recommendation-card.tsx",
  "components/recommendations/replace-item-panel.tsx",
]) {
  const source = await read(path);
  assert.doesNotMatch(
    source,
    /createClient|\.from\(|\.storage|update\(|insert\(/,
  );
}

console.log("SDD-031：衣物纸贴轮廓（039覆盖阴影）、纸纹与原图降级边界通过。");
