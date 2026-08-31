import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(import.meta.dirname, "..");
const root = new URL("../", import.meta.url);
const read = async (filePath) => readFile(new URL(filePath, root), "utf8");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const base = path.resolve(projectRoot, specifier.slice(2));
    const target = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`].find(
      existsSync,
    );
    if (!target) return nextResolve(specifier, context);
    return { shortCircuit: true, url: pathToFileURL(target).href };
  },
});

const [
  { buildRuleRecommendations },
  { validateRecommendationOutput },
  { deriveOutfitLayers },
  { buildLookbookPrompt, isOwnedLookbookPath, lookbookObjectPath },
] = await Promise.all([
  import("../lib/recommendations/rules.ts"),
  import("../lib/recommendations/validation.ts"),
  import("../lib/recommendations/layers.ts"),
  import("../lib/recommendations/lookbook.ts"),
]);

function id(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function item(index, category, overrides = {}) {
  return {
    audience: "unisex",
    brand: null,
    id: id(index),
    name: `SDD022 ${category} ${index}`,
    category,
    primary_color: index % 2 ? "navy" : "white",
    material: category === "shoes" ? "leather" : "cotton",
    style: "commute",
    seasons: ["spring", "summer", "autumn", "winter"],
    occasions: ["commute"],
    status: "active",
    ...overrides,
  };
}

function wardrobe() {
  const items = [];
  let next = 1;
  for (const category of ["tops", "accessories"]) {
    for (let index = 0; index < 6; index += 1) {
      items.push(item(next++, category));
    }
  }
  for (const category of ["bottoms", "shoes", "outerwear"]) {
    for (let index = 0; index < 3; index += 1) {
      items.push(
        item(next++, category, {
          seasons:
            category === "outerwear"
              ? ["spring", "autumn", "winter"]
              : ["spring", "summer", "autumn", "winter"],
        }),
      );
    }
  }
  return items;
}

function weather(apparentTemperatureC) {
  return {
    city: "武汉",
    temperatureC: apparentTemperatureC,
    apparentTemperatureC,
    weatherCode: 1,
    summary: apparentTemperatureC <= 8 ? "寒冷" : "晴",
    source: "live",
    observedAt: "2026-08-31T08:00:00.000Z",
    preset: "live",
  };
}

const items = wardrobe();
const coldWeather = weather(5);
const coldOutfits = buildRuleRecommendations({
  items,
  occasion: "commute",
  weather: coldWeather,
  preferredStyles: ["commute"],
});
assert.equal(coldOutfits.length, 3);
for (const outfit of coldOutfits) {
  assert.ok(outfit.itemIds.length >= 5 && outfit.itemIds.length <= 7);
  const layers = deriveOutfitLayers(outfit.itemIds, items);
  assert.equal(layers.length, outfit.itemIds.length);
  assert.equal(
    new Set(layers.map((layer) => layer.itemId)).size,
    layers.length,
  );
  assert.ok(layers.some((layer) => layer.role === "base"));
  assert.ok(layers.some((layer) => layer.role === "main"));
  assert.ok(layers.some((layer) => layer.role === "outerwear"));
  assert.ok(layers.some((layer) => layer.role === "shoes"));
}
assert.deepEqual(
  validateRecommendationOutput(
    { outfits: coldOutfits },
    items,
    "commute",
    coldWeather,
  ),
  coldOutfits,
);

const hotWeather = weather(31);
const hotOutfits = buildRuleRecommendations({
  items,
  occasion: "commute",
  weather: hotWeather,
  preferredStyles: ["commute"],
});
for (const outfit of hotOutfits) {
  const outfitItems = outfit.itemIds.map((itemId) =>
    items.find((candidate) => candidate.id === itemId),
  );
  assert.ok(
    outfitItems.filter((candidate) => candidate.category === "tops").length <=
      1,
    "热天不得强制双上装",
  );
  assert.equal(
    outfitItems.some((candidate) => candidate.category === "outerwear"),
    false,
    "热天不得强制非夏季外套",
  );
}

const invalid = structuredClone(coldOutfits);
const unusedTop = items.find(
  (candidate) =>
    candidate.category === "tops" &&
    !invalid.flatMap((outfit) => outfit.itemIds).includes(candidate.id),
);
if (unusedTop) {
  invalid[0].itemIds.push(unusedTop.id);
  assert.equal(
    validateRecommendationOutput(
      { outfits: invalid },
      items,
      "commute",
      coldWeather,
    ),
    null,
    "统一校验必须拒绝第三件上装",
  );
}

const userId = crypto.randomUUID();
const recommendationId = crypto.randomUUID();
const ownedPath = lookbookObjectPath(userId, recommendationId, 1);
assert.equal(isOwnedLookbookPath(ownedPath, userId), true);
assert.equal(isOwnedLookbookPath(ownedPath, crypto.randomUUID()), false);
const prompt = buildLookbookPrompt({
  clothingPreference: "male",
  items,
  occasion: "commute",
  outfit: coldOutfits[0],
  weather: coldWeather,
});
assert.match(prompt, /无可识别面部/);
assert.match(prompt, /内搭/);
assert.doesNotMatch(prompt, new RegExp(userId, "i"));

const [actionSource, cardSource, dataSource, imageTransportSource] =
  await Promise.all([
    read("app/recommendations/actions.ts"),
    read("components/recommendations/recommendation-card.tsx"),
    read("lib/recommendations/data.ts"),
    read("lib/openai/images.ts"),
  ]);
assert.match(actionSource, /auth\.getUser\(\)/);
assert.match(actionSource, /\.eq\("user_id", user\.id\)/);
assert.match(actionSource, /lookbookObjectPath\(user\.id/);
assert.match(actionSource, /revalidatePath\("\/recommendations"\)/);
assert.match(dataSource, /isOwnedLookbookPath/);
assert.match(dataSource, /createSignedUrls/);
assert.match(cardSource, /仅供搭配比例参考/);
assert.match(cardSource, /衣物实拍核对/);
assert.match(imageTransportSource, /\/v1\/images\/generations/);
assert.doesNotMatch(imageTransportSource, /NEXT_PUBLIC_OPENAI/);

const fallback = await stat(
  new URL("../public/virtual-models/neutral-studio.png", import.meta.url),
);
assert.ok(fallback.size > 100_000, "固定虚拟模特资产必须存在且非占位空文件");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("缺少 Supabase 测试环境变量");

async function anonymousClient() {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) throw error ?? new Error("匿名会话创建失败");
  return { client, user: data.user };
}

const a = await anonymousClient();
const b = await anonymousClient();
const storagePath = lookbookObjectPath(a.user.id, crypto.randomUUID(), 1);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=",
  "base64",
);

try {
  const upload = await a.client.storage
    .from("wardrobe-images")
    .upload(storagePath, png, { contentType: "image/png", upsert: true });
  assert.equal(upload.error, null, "当前账号必须可写入自身 Lookbook 路径");

  const ownSigned = await a.client.storage
    .from("wardrobe-images")
    .createSignedUrl(storagePath, 60);
  assert.equal(ownSigned.error, null);
  assert.ok(ownSigned.data?.signedUrl);

  const crossSigned = await b.client.storage
    .from("wardrobe-images")
    .createSignedUrl(storagePath, 60);
  assert.ok(
    crossSigned.error || !crossSigned.data?.signedUrl,
    "跨账号不得签名他人的 Lookbook",
  );
} finally {
  await a.client.storage.from("wardrobe-images").remove([storagePath]);
  await Promise.all([a.client.auth.signOut(), b.client.auth.signOut()]);
}

console.log(
  JSON.stringify(
    {
      coldOutfits: coldOutfits.map((outfit) => outfit.itemIds.length),
      hotOutfits: hotOutfits.map((outfit) => outfit.itemIds.length),
      storageIsolation: "passed",
      fallbackBytes: fallback.size,
    },
    null,
    2,
  ),
);
console.log("SDD-022 分层搭配、虚拟模特与私有缓存门禁通过。");
