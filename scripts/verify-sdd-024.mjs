import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  CANVAS_ITEM_LIMITS,
  createInitialCanvasItems,
} from "../lib/outfits/canvas.ts";
import { removeConnectedPlainBackground } from "../lib/outfits/cutout.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const requiredFiles = [
  "specs/024-outfit-canvas-share/spec.md",
  "specs/024-outfit-canvas-share/plan.md",
  "specs/024-outfit-canvas-share/tasks.md",
  "app/outfits/new/page.tsx",
  "app/outfits/[id]/page.tsx",
  "components/outfits/outfit-canvas-editor.tsx",
  "components/outfits/outfit-canvas-preview.tsx",
  "lib/outfits/cutout.ts",
  "lib/outfits/export.ts",
  "supabase/migrations/20260901022345_outfit_canvas_share.sql",
];

await Promise.all(requiredFiles.map(read));

for (let count = 2; count <= 8; count += 1) {
  const ids = Array.from(
    { length: count },
    (_, index) =>
      `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  );
  const items = createInitialCanvasItems(ids);
  assert.equal(items.length, count);
  assert.equal(new Set(items.map((item) => item.wardrobeItemId)).size, count);
  for (const item of items) {
    assert.ok(
      item.x >= CANVAS_ITEM_LIMITS.x.min && item.x <= CANVAS_ITEM_LIMITS.x.max,
    );
    assert.ok(
      item.y >= CANVAS_ITEM_LIMITS.y.min && item.y <= CANVAS_ITEM_LIMITS.y.max,
    );
  }
}

function image(width, height, pixel) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      const offset = (y * width + x) * 4;
      data.set([r, g, b, a], offset);
    }
  }
  return { data, width, height };
}

const plain = image(24, 24, (x, y) =>
  x >= 7 && x <= 16 && y >= 5 && y <= 19
    ? [180, 30, 45, 255]
    : [248, 248, 246, 255],
);
const plainResult = removeConnectedPlainBackground(plain);
assert.equal(plainResult.status, "success");
assert.equal(plainResult.image.data[3], 0);
assert.equal(plainResult.image.data[(12 * 24 + 12) * 4 + 3], 255);

const transparent = image(12, 12, (x, y) =>
  x < 2 || y < 2 ? [0, 0, 0, 0] : [30, 30, 30, 255],
);
assert.equal(
  removeConnectedPlainBackground(transparent).status,
  "already-transparent",
);

const complex = image(20, 20, (x, y) =>
  (x + y) % 2 === 0 ? [25, 25, 25, 255] : [235, 235, 235, 255],
);
assert.equal(
  removeConnectedPlainBackground(complex).status,
  "unsupported-background",
);

const recommendationCard = await read(
  "components/recommendations/recommendation-card.tsx",
);
// SDD-030 停用默认画布，历史纯函数和数据隔离测试继续保留。
assert.doesNotMatch(recommendationCard, /OutfitCanvasPreview|编辑穿搭卡片/);
assert.doesNotMatch(recommendationCard, /PrecisionOutfitPreview/);
assert.doesNotMatch(recommendationCard, /LookbookGenerator/);
assert.doesNotMatch(recommendationCard, /虚拟模特/);

const editor = await read("components/outfits/outfit-canvas-editor.tsx");
assert.match(editor, /setPointerCapture/);
assert.match(editor, /navigator\.canShare/);
assert.match(editor, /removeConnectedPlainBackground/);
assert.match(editor, /upsert: true/);
// 停用后的安全边界由无存储写入的旧 action 保证，不依赖已移除的提示文案。
assert.doesNotMatch(
  await read("app/outfits/actions.ts"),
  /\.storage|\.update\(|\.upsert\(/,
);

const migration = await read(
  "supabase/migrations/20260901022345_outfit_canvas_share.sql",
);
assert.match(migration, /create table public\.outfit_canvases/);
assert.match(migration, /enable row level security/);
assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
assert.match(migration, /outfit_canvases_user_updated_idx/);
assert.match(migration, /wardrobe_items_cutout_path_owned/);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey) {
  throw new Error("缺少 Supabase 公开测试配置。请通过 .env.local 运行。 ");
}

const clients = [
  createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  }),
  createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  }),
];
const sessions = await Promise.all(
  clients.map((client) => client.auth.signInAnonymously()),
);
for (const session of sessions) assert.ifError(session.error);
const userIds = sessions.map((session) => session.data.user.id);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/69uArwAAAABJRU5ErkJggg==",
  "base64",
);
const createdItemIds = [];
const createdPaths = [];

try {
  for (let userIndex = 0; userIndex < clients.length; userIndex += 1) {
    const client = clients[userIndex];
    const userId = userIds[userIndex];
    for (let index = 0; index < 2; index += 1) {
      const path = `${userId}/sdd-024/item-${index}.png`;
      const upload = await client.storage
        .from("wardrobe-images")
        .upload(path, png, { contentType: "image/png", upsert: true });
      assert.ifError(upload.error);
      createdPaths.push({ client, path });
      const insert = await client
        .from("wardrobe_items")
        .insert({
          user_id: userId,
          name: `SDD024衣物${index}`,
          category: index === 0 ? "tops" : "bottoms",
          primary_color: "black",
          material: "cotton",
          style: "minimal",
          seasons: ["spring"],
          occasions: ["casual"],
          audience: "unisex",
          image_path: path,
        })
        .select("id")
        .single();
      assert.ifError(insert.error);
      createdItemIds.push({ client, id: insert.data.id, userId });
    }
  }

  const aItems = createdItemIds.filter((item) => item.userId === userIds[0]);
  const bItems = createdItemIds.filter((item) => item.userId === userIds[1]);
  const layout = (rows) => createInitialCanvasItems(rows.map((row) => row.id));
  const aCanvas = await clients[0]
    .from("outfit_canvases")
    .insert({
      user_id: userIds[0],
      title: "隔离测试 A",
      background_theme: "lime",
      items: layout(aItems),
    })
    .select("id")
    .single();
  const bCanvas = await clients[1]
    .from("outfit_canvases")
    .insert({
      user_id: userIds[1],
      title: "隔离测试 B",
      background_theme: "lilac",
      items: layout(bItems),
    })
    .select("id")
    .single();
  assert.ifError(aCanvas.error);
  assert.ifError(bCanvas.error);

  const crossRead = await clients[0]
    .from("outfit_canvases")
    .select("id")
    .eq("id", bCanvas.data.id);
  assert.ifError(crossRead.error);
  assert.equal(crossRead.data.length, 0);

  const crossUpdate = await clients[0]
    .from("outfit_canvases")
    .update({ title: "越权" })
    .eq("id", bCanvas.data.id)
    .select("id");
  assert.ifError(crossUpdate.error);
  assert.equal(crossUpdate.data.length, 0);

  const bCutoutPath = `${userIds[1]}/cutouts/${bItems[0].id}.png`;
  const bUpload = await clients[1].storage
    .from("wardrobe-images")
    .upload(bCutoutPath, png, { contentType: "image/png", upsert: true });
  assert.ifError(bUpload.error);
  createdPaths.push({ client: clients[1], path: bCutoutPath });
  const bBind = await clients[1]
    .from("wardrobe_items")
    .update({ cutout_path: bCutoutPath })
    .eq("id", bItems[0].id)
    .select("id")
    .single();
  assert.ifError(bBind.error);
  const crossSigned = await clients[0].storage
    .from("wardrobe-images")
    .createSignedUrl(bCutoutPath, 60);
  assert.ok(crossSigned.error);

  await clients[0].from("outfit_canvases").delete().eq("id", aCanvas.data.id);
  await clients[1].from("outfit_canvases").delete().eq("id", bCanvas.data.id);
} finally {
  for (const item of createdItemIds) {
    await item.client.from("wardrobe_items").delete().eq("id", item.id);
  }
  for (const { client, path } of createdPaths) {
    await client.storage.from("wardrobe-images").remove([path]);
  }
  await Promise.all(clients.map((client) => client.auth.signOut()));
}

console.log(
  "SDD-024 verification passed: local cutout, canvas boundaries, no-model path, RLS and private Storage isolation.",
);
