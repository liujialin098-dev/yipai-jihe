import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const page = await read("app/stickers/page.tsx");
for (const contract of [
  "outfit_diary_entries",
  "wardrobe_item_favorites",
  "monthBounds",
  "resolveDiaryMonth",
  "viewer.userId",
  "canvasStorageKey",
  "monthEntries",
]) {
  assert.ok(page.includes(contract), `贴纸页缺少月历数据边界：${contract}`);
}

const studio = await read("components/stickers/sticker-studio.tsx");
for (const contract of [
  "StickerCanvas",
  "StickerMonthCalendar",
  'label="画板"',
  'label="月历"',
  "MAX_SELECTION = 8",
  "/api/stickers/items/",
  "今日想穿",
  "我的喜欢",
]) {
  assert.ok(studio.includes(contract), `贴纸工作室缺少合同：${contract}`);
}
assert.doesNotMatch(studio, /MP4|Live|转盘|Firework|watchPosition/);

const canvas = await read("components/stickers/sticker-canvas.tsx");
for (const contract of [
  "onPointerDown",
  "onPointerMove",
  "setPointerCapture",
  "onKeyDown",
  'type="range"',
  "置顶",
  "置底",
  "重排",
  "下载",
  "分享",
  "navigator.share",
  "navigator.canShare",
  "localStorage",
  '"浅色"',
  '"深色"',
  "data-tone={palette.tone}",
  'surface={wardrobeItem.cutoutUrl ? "loose" : "card"}',
]) {
  assert.ok(canvas.includes(contract), `自由画板缺少合同：${contract}`);
}
assert.doesNotMatch(canvas, /userId|cutout_path|image_path|watchPosition/);

const canvasModel = await read("lib/stickers/canvas.ts");
for (const boundary of [
  "STICKER_CANVAS_LIMITS",
  "createInitialStickerCanvasItems",
  "reconcileStickerCanvasItems",
  "parseStoredStickerCanvas",
  "normalizeStickerStack",
  "value.version !== 1",
  'value: "plum"',
  'value: "midnight"',
  'value: "forest"',
  'value: "espresso"',
  'tone: "dark"',
  "endColor",
  "accentColor",
  "1: [[0.5, 0.55]]",
  "slice(0, 8)",
]) {
  assert.ok(canvasModel.includes(boundary), `画板状态缺少边界：${boundary}`);
}

const exporter = await read("lib/stickers/export.ts");
for (const contract of [
  "canvas.width = width",
  "canvas.height = height",
  "const width = 1080",
  "const height = 1350",
  '"image/png"',
  "zIndex",
  "rotation",
  "createSolidOutline",
  "palette.endColor",
  "palette.accentColor",
]) {
  assert.ok(exporter.includes(contract), `图片导出缺少合同：${contract}`);
}
assert.doesNotMatch(exporter, /email|userId|storage|cutout_path/);

const calendar = await read("components/stickers/sticker-month-calendar.tsx");
for (const contract of [
  "grid-cols-7",
  "favoriteSet.has",
  "visibleIds[0]",
  "记录",
  "代表",
  "最常出现",
  "查看上个月",
  "查看下个月",
  "/diary/new?date=",
]) {
  assert.ok(calendar.includes(contract), `月历缺少合同：${contract}`);
}

const css = await read("app/globals.css");
for (const style of [
  ".sticker-free-canvas",
  ".sticker-free-canvas-item",
  ".sticker-tool-range",
  ".sticker-month-card",
  ".sticker-calendar-day",
  '.sticker-free-canvas[data-tone="dark"]',
  "prefers-reduced-motion",
]) {
  assert.ok(css.includes(style), `贴纸视觉缺少合同：${style}`);
}
const freeCanvasCss = css.slice(
  css.indexOf(".sticker-free-canvas {"),
  css.indexOf(".sticker-free-canvas::after"),
);
assert.doesNotMatch(freeCanvasCss, /repeating-linear-gradient/);

const oldRoute = await read("app/api/wardrobe/items/[id]/cutout/route.ts");
assert.match(oldRoute, /410/);

const packageJson = JSON.parse(await read("package.json"));
assert.equal(
  packageJson.scripts["verify:sdd-034"],
  "node --no-warnings scripts/verify-sdd-034.mjs",
);

console.log("SDD-034：自由贴纸画板、高清导出、月历统计与账号边界通过。");
