import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  OUTFIT_CATEGORY_SCALE,
  createInitialCanvasItems,
} from "../lib/outfits/canvas.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

await Promise.all(
  [
    "specs/026-vibrant-auto-cutout/spec.md",
    "specs/026-vibrant-auto-cutout/plan.md",
    "specs/026-vibrant-auto-cutout/tasks.md",
    "specs/026-vibrant-auto-cutout/contracts/professional-cutout.md",
    "app/api/wardrobe/items/[id]/cutout/route.ts",
    "app/api/wardrobe/items/[id]/cutout/source/route.ts",
    "components/outfits/cutout-refiner.tsx",
    "lib/outfits/professional-cutout.ts",
  ].map(read),
);

const categories = Object.keys(OUTFIT_CATEGORY_SCALE);
const ids = categories.map(
  (_, index) =>
    `00000000-0000-4000-8000-${String(index + 80).padStart(12, "0")}`,
);
const categoryById = new Map(ids.map((id, index) => [id, categories[index]]));
const layout = createInitialCanvasItems(ids, categoryById);
const scaleByCategory = new Map(
  layout.map((item) => [categoryById.get(item.wardrobeItemId), item.scale]),
);
assert.ok(scaleByCategory.get("outerwear") > scaleByCategory.get("tops"));
assert.ok(scaleByCategory.get("dresses") > scaleByCategory.get("shoes"));
assert.ok(scaleByCategory.get("shoes") > scaleByCategory.get("accessories"));

const transparent = await sharp({
  create: {
    width: 80,
    height: 100,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    {
      input: await sharp({
        create: {
          width: 30,
          height: 50,
          channels: 4,
          background: { r: 180, g: 40, b: 70, alpha: 1 },
        },
      })
        .png()
        .toBuffer(),
      left: 25,
      top: 24,
    },
  ])
  .png()
  .toBuffer();
const normalized = await sharp(transparent).ensureAlpha().png().toBuffer();
const trimmed = await sharp(normalized)
  .trim({
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    threshold: 3,
  })
  .extend({
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();
const displayMeta = await sharp(trimmed).metadata();
const sourceMeta = await sharp(normalized).metadata();
assert.equal(sourceMeta.width, 80);
assert.equal(sourceMeta.height, 100);
assert.ok(displayMeta.width < sourceMeta.width);
assert.ok(displayMeta.height < sourceMeta.height);

const [service, cutoutRoute, confirmRoute, refiner, editor, styles, env] =
  await Promise.all([
    read("lib/outfits/professional-cutout.ts"),
    read("app/api/wardrobe/items/[id]/cutout/route.ts"),
    read("app/api/wardrobe/ingestions/[id]/confirm/route.ts"),
    read("components/outfits/cutout-refiner.tsx"),
    read("components/outfits/outfit-canvas-editor.tsx"),
    read("app/globals.css"),
    read(".env.example"),
  ]);
assert.match(service, /process\.env\.PHOTOROOM_API_KEY/);
assert.match(service, /https:\/\/sdk\.photoroom\.com\/v1\/segment/);
assert.match(service, /form\.set\("crop", "false"\)/);
assert.match(service, /form\.set\("channels", "rgba"\)/);
assert.match(service, /form\.set\("despill", "true"\)/);
assert.match(service, /\.trim\(\{/);
assert.match(service, /\/cutout-sources\//);
assert.doesNotMatch(editor, /PHOTOROOM_API_KEY|sdk\.photoroom\.com/);
assert.doesNotMatch(refiner, /PHOTOROOM_API_KEY|sdk\.photoroom\.com/);
assert.match(cutoutRoute, /auth\.getUser\(\)/);
assert.match(service, /\.eq\("user_id", userId\)/);
assert.match(confirmRoute, /after\(async \(\) =>/);
assert.match(refiner, /"erase" \| "restore"/);
assert.match(refiner, /globalCompositeOperation = "destination-out"/);
assert.match(refiner, /context\.drawImage\(original, 0, 0\)/);
assert.match(editor, /重新专业抠图/);
assert.match(editor, /边缘精修/);
assert.match(styles, /--background: #f1edff/);
assert.match(styles, /--fashion-lilac/);
assert.match(styles, /prefers-reduced-transparency/);
assert.match(env, /PHOTOROOM_API_KEY/);
assert.doesNotMatch(env, /NEXT_PUBLIC_PHOTOROOM/);
const outfitCanvasCss =
  styles.match(/\.outfit-canvas \{[\s\S]*?\n\}/)?.[0] ?? "";
assert.ok(outfitCanvasCss);
assert.doesNotMatch(outfitCanvasCss, /repeating-|grid|background-size/);

console.log(
  "SDD-026 verification passed: PhotoRoom contract, transparent trim, category sizing, manual erase/restore, no-grid canvas and server-only key boundary.",
);
