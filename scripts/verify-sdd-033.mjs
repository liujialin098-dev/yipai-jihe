import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const page = await read("app/stickers/page.tsx");
assert.match(page, /getWardrobeItems/);
assert.match(page, /wardrobe_item_favorites/);
assert.match(page, /viewer\.userId/);
assert.match(page, /StickerStudio/);
assert.match(page, /ensemble:sticker-studio:/);

const studio = await read("components/stickers/sticker-studio.tsx");
for (const contract of [
  "今日想穿",
  "我的喜欢",
  "MAX_SELECTION = 8",
  "localStorage",
  "待生成",
  "贴纸就绪",
  "正在生成",
  "/api/stickers/items/",
  'method: "POST"',
  'credentials: "same-origin"',
]) {
  assert.ok(studio.includes(contract), `缺少贴纸册合同：${contract}`);
}
assert.doesNotMatch(studio, /userId|cutout_path|image_path|watchPosition/);
assert.doesNotMatch(studio, /MP4|Live|转盘/);

const canvas = await read("components/stickers/sticker-canvas.tsx");
assert.match(canvas, /surface=\{wardrobeItem\.cutoutUrl \? "loose" : "card"\}/);

const route = await read("app/api/stickers/items/[id]/route.ts");
for (const boundary of [
  "auth.getUser()",
  "isUuid(id)",
  "processProfessionalCutout",
  'request.headers.get("origin") !== url.origin',
  'request.headers.get("sec-fetch-site") === "cross-site"',
  '"Cache-Control": "private, no-store"',
]) {
  assert.ok(route.includes(boundary), `缺少服务端边界：${boundary}`);
}
assert.doesNotMatch(
  route,
  /request\.json\(|NEXT_PUBLIC_BAIDU|BAIDU_SECRET_KEY/,
);

const sticker = await read("components/wardrobe/garment-sticker.tsx");
assert.match(sticker, /surface\?: "card" \| "loose"/);
assert.match(sticker, /surface = "card"/);
assert.match(sticker, /data-sticker-surface=\{surface\}/);

const css = await read("app/globals.css");
for (const style of [
  'data-sticker-surface="loose"',
  ".sticker-studio-board",
  ".sticker-board-piece",
  "pointer: fine",
  "prefers-reduced-motion",
]) {
  assert.ok(css.includes(style), `缺少贴纸视觉合同：${style}`);
}

// SDD-037 removes the duplicate homepage card; the persistent dock owns its entry.
assert.match(await read("lib/ui/navigation.ts"), /href: "\/stickers"/);
for (const entry of ["app/diary/page.tsx"]) {
  const source = await read(entry);
  assert.match(source, /href="\/stickers"/, `${entry} 缺少贴纸册入口`);
}

const oldRoute = await read("app/api/wardrobe/items/[id]/cutout/route.ts");
assert.match(oldRoute, /410/);

const packageJson = JSON.parse(await read("package.json"));
assert.equal(
  packageJson.scripts["verify:sdd-033"],
  "node --no-warnings scripts/verify-sdd-033.mjs",
);

console.log("SDD-033：衣物贴纸册选择、专业生成与账号隔离边界通过。");
