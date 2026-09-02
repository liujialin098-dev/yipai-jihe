import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  OUTFIT_CATEGORY_SCALE,
  createInitialCanvasItems,
} from "../lib/outfits/canvas.ts";
import { requestBaiduCutout } from "../lib/outfits/baidu-cutout.ts";

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
    "lib/outfits/baidu-cutout.ts",
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

const baiduSource = await sharp({
  create: {
    width: 180,
    height: 160,
    channels: 3,
    background: { r: 240, g: 238, b: 235 },
  },
})
  .jpeg()
  .toBuffer();
const baiduCalls = [];
const fakeBaiduFetch = async (input, init = {}) => {
  const url = String(input);
  baiduCalls.push({ body: init.body, url });
  if (url === "https://aip.baidubce.com/oauth/2.0/token") {
    assert.ok(init.body instanceof URLSearchParams);
    assert.equal(init.body.get("grant_type"), "client_credentials");
    assert.equal(init.body.get("client_id"), "test-api-key");
    assert.equal(init.body.get("client_secret"), "test-secret-key");
    return new Response(
      JSON.stringify({
        access_token: "test-access-token",
        expires_in: 2592000,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  const endpoint = new URL(url);
  assert.equal(
    endpoint.origin + endpoint.pathname,
    "https://aip.baidubce.com/rest/2.0/image-process/v1/segment",
  );
  assert.equal(endpoint.searchParams.get("access_token"), "test-access-token");
  const payload = JSON.parse(String(init.body));
  assert.equal(payload.method, "auto");
  assert.equal(payload.refine_mask, "true");
  assert.equal(payload.return_form, "rgba");
  assert.ok(payload.image.length > 100);
  return new Response(
    JSON.stringify({ log_id: "test", image: transparent.toString("base64") }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};
const credentials = {
  apiKey: "test-api-key",
  secretKey: "test-secret-key",
};
const firstBaiduResult = await requestBaiduCutout(
  new Blob([baiduSource], { type: "image/jpeg" }),
  credentials,
  fakeBaiduFetch,
  () => 1_000,
);
const secondBaiduResult = await requestBaiduCutout(
  new Blob([baiduSource], { type: "image/jpeg" }),
  credentials,
  fakeBaiduFetch,
  () => 2_000,
);
assert.equal(firstBaiduResult.type, "image/png");
assert.equal(secondBaiduResult.type, "image/png");
assert.equal(
  baiduCalls.filter(({ url }) => url.endsWith("/oauth/2.0/token")).length,
  1,
);
assert.equal(baiduCalls.length, 3);

const [
  baiduService,
  service,
  cutoutRoute,
  confirmRoute,
  refiner,
  editor,
  styles,
  env,
] = await Promise.all([
  read("lib/outfits/baidu-cutout.ts"),
  read("lib/outfits/professional-cutout.ts"),
  read("app/api/wardrobe/items/[id]/cutout/route.ts"),
  read("app/api/wardrobe/ingestions/[id]/confirm/route.ts"),
  read("components/outfits/cutout-refiner.tsx"),
  read("components/outfits/outfit-canvas-editor.tsx"),
  read("app/globals.css"),
  read(".env.example"),
]);
assert.match(baiduService, /process\.env\.BAIDU_API_KEY/);
assert.match(baiduService, /process\.env\.BAIDU_SECRET_KEY/);
assert.match(baiduService, /https:\/\/aip\.baidubce\.com\/oauth\/2\.0\/token/);
assert.match(
  baiduService,
  /https:\/\/aip\.baidubce\.com\/rest\/2\.0\/image-process\/v1\/segment/,
);
assert.match(baiduService, /method: "auto"/);
assert.match(baiduService, /refine_mask: "true"/);
assert.match(baiduService, /return_form: "rgba"/);
assert.match(service, /requestBaiduCutout\(original\.data\)/);
assert.match(service, /\.trim\(\{/);
assert.match(service, /\/cutout-sources\//);
assert.doesNotMatch(
  editor,
  /BAIDU_API_KEY|BAIDU_SECRET_KEY|aip\.baidubce\.com/,
);
assert.doesNotMatch(
  refiner,
  /BAIDU_API_KEY|BAIDU_SECRET_KEY|aip\.baidubce\.com/,
);
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
assert.match(env, /BAIDU_API_KEY/);
assert.match(env, /BAIDU_SECRET_KEY/);
assert.doesNotMatch(env, /NEXT_PUBLIC_BAIDU/);
assert.doesNotMatch(env, /PHOTOROOM_API_KEY/);
const outfitCanvasCss =
  styles.match(/\.outfit-canvas \{[\s\S]*?\n\}/)?.[0] ?? "";
assert.ok(outfitCanvasCss);
assert.doesNotMatch(outfitCanvasCss, /repeating-|grid|background-size/);

console.log(
  "SDD-026 verification passed: Baidu token/cache and cutout contract, transparent trim, category sizing, manual erase/restore, no-grid canvas and server-only key boundary.",
);
