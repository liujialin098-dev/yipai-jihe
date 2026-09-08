import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  model,
  canvas,
  exporter,
  navigation,
  header,
  diary,
  calendar,
  data,
  wall,
  css,
] = await Promise.all([
  read("lib/stickers/canvas.ts"),
  read("components/stickers/sticker-canvas.tsx"),
  read("lib/stickers/export.ts"),
  read("components/bottom-navigation.tsx"),
  read("components/status-header.tsx"),
  read("app/diary/page.tsx"),
  read("components/diary/diary-sticker-calendar.tsx"),
  read("lib/diary/data.ts"),
  read("components/diary/utilization-sticker-wall.tsx"),
  read("app/globals.css"),
]);

for (const contract of [
  "StickerCrop",
  "EMPTY_STICKER_CROP",
  "clampStickerCrop",
  "moveStickerLayer",
  "value.version !== 2",
  "reindexStickerStack",
]) {
  assert.ok(model.includes(contract), `贴纸状态缺少合同：${contract}`);
}
const layerStart = model.indexOf("export function moveStickerLayer");
const layerEnd = model.indexOf(
  "export function createInitialStickerCanvasItems",
  layerStart,
);
const layerBlock = model.slice(layerStart, layerEnd);
assert.ok(layerBlock.includes("reindexStickerStack"));
assert.ok(layerBlock.includes("[...rest, selected] : [selected, ...rest]"));

for (const contract of [
  "version: 2",
  "CornerHandle",
  'position="top-left"',
  'position="top-right"',
  'position="bottom-left"',
  'position="bottom-right"',
  '"收起裁切" : "裁切"',
  "完成裁切",
  "moveStickerLayer",
  "setPointerCapture",
]) {
  assert.ok(canvas.includes(contract), `贴纸画板缺少合同：${contract}`);
}
assert.match(
  exporter,
  /context\.rect\(cropLeft, cropTop, cropWidth, cropHeight\)/,
);
assert.match(exporter, /context\.clip\(\)/);

for (const label of ["首页", "日记", "贴纸", "收藏", "推荐"]) {
  assert.ok(navigation.includes(`label: "${label}"`), `底部导航缺少：${label}`);
}
assert.ok(navigation.includes('href: "/stickers"'));
assert.ok(navigation.includes('href: "/diary?view=favorites"'));
assert.ok(header.includes('aria-label="打开衣库"'));
assert.ok(header.includes('href="/wardrobe"'));

for (const contract of [
  "DiaryStickerCalendar",
  "添加一件单品",
  "StickerWorkspaceEntry",
  "UtilizationStickerWall",
  "recentStickerItems",
]) {
  assert.ok(diary.includes(contract), `日记页缺少合同：${contract}`);
}
assert.ok(calendar.includes("monthCells"));
assert.ok(calendar.includes("date > today"));
assert.ok(calendar.includes("entry.items.length"));
assert.ok(data.includes('diaryRangeStart("30", today)'));
assert.ok(data.includes("recentReport.frequentItems.slice(0, 24)"));
assert.ok(wall.includes("items.map"));
assert.doesNotMatch(wall, /demo|mock|placeholder/i);

for (const style of [
  ".sticker-corner-handle",
  ".sticker-crop-panel",
  ".sticker-diary-entry",
  ".utilization-sticker-wall",
]) {
  assert.ok(css.includes(style), `样式缺少合同：${style}`);
}

const packageJson = JSON.parse(await read("package.json"));
assert.equal(
  packageJson.scripts["verify:sdd-035"],
  "node --no-warnings scripts/verify-sdd-035.mjs",
);

console.log(
  "SDD-035：贴纸层级、四角手势、裁切、主导航、日记月历与利用率贴纸墙通过。",
);
