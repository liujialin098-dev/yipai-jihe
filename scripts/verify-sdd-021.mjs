import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");

const expectedStyles = [
  "minimal",
  "casual",
  "commute",
  "elegant",
  "sporty",
  "vintage",
  "cleanfit",
  "streetwear",
  "cityboy",
  "gorpcore",
  "preppy",
  "workwear",
  "oldmoney",
  "y2k",
];

const [constants, recognition, migration, direction, trendCatalog, controls] =
  await Promise.all([
    read("lib/wardrobe/constants.ts"),
    read("lib/wardrobe/recognition.ts"),
    read("supabase/migrations/20260831035412_style_intelligence.sql"),
    read("lib/recommendations/style-direction.ts"),
    read("lib/recommendations/trend-catalog.ts"),
    read("components/recommendations/recommendation-controls.tsx"),
  ]);

for (const style of expectedStyles) {
  assert.match(constants, new RegExp(`value: ["']${style}["']`));
  assert.match(recognition, new RegExp(`["']${style}["']`));
  assert.match(migration, new RegExp(`["']${style}["']`));
}
assert.match(recognition, /brand_confidence/);
assert.match(recognition, /不得根据版型、配色或相似设计猜测/);
assert.match(migration, /add column brand text/);
assert.match(direction, /AUTO_STYLE_FOCUS/);
assert.match(direction, /resolveStyleDirections/);
assert.match(controls, /name="styleFocus"/);
assert.doesNotMatch(trendCatalog, /fetch\s*\(/);

const trendSources = [
  ...trendCatalog.matchAll(/sourceUrl:\s*\n?\s*"(https:[^"]+)"/g),
];
assert.ok(trendSources.length >= 5, "趋势灵感必须至少有 5 个 https 来源");
assert.ok(
  (trendCatalog.match(/publishedAt:/g) ?? []).length >= 5,
  "趋势灵感必须带发布日期",
);
assert.ok(
  (trendCatalog.match(/validUntil:/g) ?? []).length >= 5,
  "趋势灵感必须带有效期",
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error("缺少 Supabase 测试环境变量");
}

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
const row = (userId, style, brand) => ({
  user_id: userId,
  audience: "unisex",
  name: `SDD021-${style}`,
  brand,
  category: "tops",
  primary_color: "black",
  material: "cotton",
  style,
  seasons: ["autumn"],
  occasions: ["casual"],
  image_path: `${userId}/tests/sdd021-${crypto.randomUUID()}.png`,
});

try {
  const insert = await a.client
    .from("wardrobe_items")
    .insert(row(a.user.id, "cleanfit", "Visible Brand"))
    .select("id, brand, style")
    .single();
  assert.equal(insert.error, null);
  assert.equal(insert.data.brand, "Visible Brand");
  assert.equal(insert.data.style, "cleanfit");

  const crossRead = await b.client
    .from("wardrobe_items")
    .select("id")
    .eq("id", insert.data.id);
  assert.equal(crossRead.error, null);
  assert.equal(crossRead.data.length, 0, "跨账号读取必须被 RLS 隔离");

  const invalidStyle = await a.client
    .from("wardrobe_items")
    .insert(row(a.user.id, "invented-style", null));
  assert.ok(invalidStyle.error, "数据库必须拒绝未知风格");

  const longBrand = await a.client
    .from("wardrobe_items")
    .insert(row(a.user.id, "casual", "B".repeat(41)));
  assert.ok(longBrand.error, "数据库必须拒绝超长品牌");
} finally {
  await a.client
    .from("wardrobe_items")
    .delete()
    .eq("user_id", a.user.id)
    .like("name", "SDD021-%");
  await b.client
    .from("wardrobe_items")
    .delete()
    .eq("user_id", b.user.id)
    .like("name", "SDD021-%");
  await Promise.all([a.client.auth.signOut(), b.client.auth.signOut()]);
}

console.log(
  "SDD-021 verified: 14 styles, brand safety, RLS, and sourced trends.",
);
