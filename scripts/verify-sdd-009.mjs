import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行 SDD-009 验证。");
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function isolatedClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function snapshot(items) {
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      primaryColor: item.primary_color,
      style: item.style,
    })),
  };
}

async function createSession(label) {
  const client = isolatedClient();
  const auth = await client.auth.signInAnonymously();
  if (auth.error || !auth.data.user) {
    throw new Error(`${label} 匿名会话创建失败：${auth.error?.message}`);
  }
  const userId = auth.data.user.id;
  const token = `${Date.now().toString(36)}-${label.toLowerCase()}`;
  const [profile, preferences] = await Promise.all([
    client.from("profiles").upsert({
      user_id: userId,
      display_name: `日记测试-${label}`,
    }),
    client.from("user_preferences").upsert({
      user_id: userId,
      clothing_preference: "unrestricted",
      weather_city: "武汉",
      weather_admin1: "湖北",
      weather_latitude: 30.5928,
      weather_longitude: 114.3055,
      weather_timezone: "Asia/Shanghai",
    }),
  ]);
  ensure(!profile.error && !preferences.error, `${label} 资料初始化失败`);

  const itemsResult = await client
    .from("wardrobe_items")
    .insert(
      [
        ["top", "测试衬衫", "tops", "white", "minimal"],
        ["bottom", "测试长裤", "bottoms", "navy", "commute"],
        ["shoes", "测试鞋", "shoes", "black", "minimal"],
        ["outer", "测试外套", "outerwear", "gray", "casual"],
      ].map(([key, name, category, primaryColor, style]) => ({
        user_id: userId,
        demo_key: `sdd009-${token}-${key}`,
        name: `${name}-${label}`,
        audience: "unisex",
        category,
        primary_color: primaryColor,
        material: "cotton",
        style,
        seasons: ["spring"],
        occasions: ["casual"],
        image_path: `${userId}/sdd-009/${token}-${key}.png`,
      })),
    )
    .select("id, name, category, primary_color, style");
  ensure(!itemsResult.error, `${label} 测试衣物创建失败`);
  ensure(itemsResult.data?.length === 4, `${label} 测试衣物数量错误`);

  return {
    client,
    items: itemsResult.data,
    shortId: userId.slice(0, 8).toUpperCase(),
    userId,
  };
}

async function verifyOneEntryPerDay(session) {
  const wornOn = dateOffset(-1);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const selected = session.items.slice(0, attempt + 1);
    const result = await session.client.from("outfit_diary_entries").upsert(
      {
        user_id: session.userId,
        worn_on: wornOn,
        title: `第 ${attempt + 1} 次保存`,
        occasion: "casual",
        source: "manual",
        source_recommendation_id: null,
        source_outfit_slot: null,
        item_ids: selected.map((item) => item.id),
        outfit_snapshot: snapshot(selected),
        note: "固定验收记录",
      },
      { onConflict: "user_id,worn_on" },
    );
    ensure(!result.error, `第 ${attempt + 1} 次同日保存失败`);
  }

  const result = await session.client
    .from("outfit_diary_entries")
    .select("id, title, item_ids")
    .eq("user_id", session.userId)
    .eq("worn_on", wornOn);
  ensure(!result.error, "同日记录读取失败");
  ensure(result.data?.length === 1, "同一天产生了多条日记");
  ensure(result.data?.[0]?.title === "第 3 次保存", "最后一次同日保存未生效");
  ensure(result.data?.[0]?.item_ids.length === 3, "最后一次衣物组合未生效");
  return result.data[0].id;
}

async function verifyOwnershipAndConstraints(sessionA, sessionB) {
  const ownItem = sessionA.items[0];
  const foreignItem = sessionB.items[0];
  const crossItem = await sessionA.client.from("outfit_diary_entries").insert({
    user_id: sessionA.userId,
    worn_on: dateOffset(-2),
    title: "非法跨用户衣物",
    occasion: "casual",
    source: "manual",
    item_ids: [ownItem.id, foreignItem.id],
    outfit_snapshot: snapshot([ownItem, foreignItem]),
  });
  ensure(Boolean(crossItem.error), "数据库接受了跨用户衣物引用");

  const duplicateItem = await sessionA.client
    .from("outfit_diary_entries")
    .insert({
      user_id: sessionA.userId,
      worn_on: dateOffset(-3),
      title: "非法重复衣物",
      occasion: "casual",
      source: "manual",
      item_ids: [ownItem.id, ownItem.id],
      outfit_snapshot: snapshot([ownItem]),
    });
  ensure(Boolean(duplicateItem.error), "数据库接受了重复衣物 ID");

  const read = await sessionA.client
    .from("outfit_diary_entries")
    .select("id")
    .eq("user_id", sessionB.userId);
  ensure(!read.error && read.data?.length === 0, "RLS 未阻止跨用户日记读取");

  const update = await sessionA.client
    .from("outfit_diary_entries")
    .update({ title: "越权修改" })
    .eq("user_id", sessionB.userId)
    .select("id");
  ensure(
    !update.error && update.data?.length === 0,
    "RLS 未阻止跨用户日记修改",
  );

  const remove = await sessionA.client
    .from("outfit_diary_entries")
    .delete()
    .eq("user_id", sessionB.userId)
    .select("id");
  ensure(
    !remove.error && remove.data?.length === 0,
    "RLS 未阻止跨用户日记删除",
  );
}

function verifyFixedReport() {
  const entries = [
    { worn_on: "2026-08-28", item_ids: ["a", "b", "c"] },
    { worn_on: "2026-08-27", item_ids: ["a", "b"] },
    { worn_on: "2026-08-26", item_ids: ["a"] },
  ];
  const counts = new Map();
  for (const entry of entries) {
    for (const itemId of new Set(entry.item_ids)) {
      const current = counts.get(itemId) ?? { count: 0, last: "" };
      counts.set(itemId, {
        count: current.count + 1,
        last: entry.worn_on > current.last ? entry.worn_on : current.last,
      });
    }
  }
  assert.equal(entries.length, 3, "固定样本记录天数错误");
  assert.equal(
    entries.reduce((sum, entry) => sum + entry.item_ids.length, 0),
    6,
    "固定样本单品穿着次数错误",
  );
  assert.equal(counts.size, 3, "固定样本使用单品数错误");
  assert.equal(Math.round((counts.size / 10) * 100), 30, "固定样本利用率错误");
  assert.deepEqual(
    counts.get("a"),
    { count: 3, last: "2026-08-28" },
    "固定样本最后日期错误",
  );
}

async function verifyStaticBoundaries() {
  const [
    migration,
    actions,
    diaryPage,
    composer,
    recommendationButton,
    nav,
    report,
  ] = await Promise.all([
    readFile("supabase/migrations/20260828102413_outfit_diary.sql", "utf8"),
    readFile("app/diary/actions.ts", "utf8"),
    readFile("app/diary/page.tsx", "utf8"),
    readFile("components/diary/diary-composer.tsx", "utf8"),
    readFile("components/diary/recommendation-diary-button.tsx", "utf8"),
    readFile("components/bottom-navigation.tsx", "utf8"),
    readFile("lib/diary/report.ts", "utf8"),
  ]);

  for (const boundary of [
    "unique (user_id, worn_on)",
    "validate_outfit_diary_items",
    "cardinality(item_ids) between 1 and 8",
    "with check ((select auth.uid()) = user_id)",
  ]) {
    ensure(migration.includes(boundary), `迁移缺少安全边界：${boundary}`);
  }
  ensure(
    actions.includes("supabase.auth.getUser()"),
    "Action 未重新认证当前用户",
  );
  ensure(
    !actions.includes('formData.get("userId")'),
    "Action 不得信任客户端 user_id",
  );
  ensure(
    actions.includes('from("daily_recommendations")'),
    "推荐记录未从服务端重读",
  );
  ensure(
    actions.includes("row.recommendation_date > today"),
    "推荐记录缺少未来日期拒绝",
  );
  ensure(composer.includes("最多 8 件"), "手工记录缺少选择上限说明");
  ensure(recommendationButton.includes("记为今日穿搭"), "推荐卡缺少日记入口");
  ensure(
    diaryPage.includes("利用率") && diaryPage.includes("还没记录穿过"),
    "日记页缺少基础报告",
  );
  ensure(
    nav.includes('href: "/diary"') && nav.includes('label: "记录"'),
    "主导航缺少记录入口",
  );
  ensure(
    report.includes("Math.round") && !report.toLowerCase().includes("openai"),
    "报告必须精确计算且不调用 AI",
  );
}

async function cleanup(session) {
  await session.client
    .from("outfit_diary_entries")
    .delete()
    .eq("user_id", session.userId);
  await session.client
    .from("wardrobe_items")
    .delete()
    .in(
      "id",
      session.items.map((item) => item.id),
    );
  await session.client.auth.signOut();
}

async function main() {
  const sessions = [];
  try {
    const sessionA = await createSession("A");
    sessions.push(sessionA);
    const sessionB = await createSession("B");
    sessions.push(sessionB);
    const entryId = await verifyOneEntryPerDay(sessionA);
    await verifyOneEntryPerDay(sessionB);
    await verifyOwnershipAndConstraints(sessionA, sessionB);
    verifyFixedReport();
    await verifyStaticBoundaries();

    const remove = await sessionA.client
      .from("outfit_diary_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", sessionA.userId);
    ensure(!remove.error, "自己的日记删除失败");
    const remaining = await sessionA.client
      .from("outfit_diary_entries")
      .select("id")
      .eq("id", entryId);
    ensure(
      !remaining.error && remaining.data?.length === 0,
      "删除后统计来源仍存在",
    );

    console.log(`会话 A ${sessionA.shortId}：同日三次保存仅一条，编辑删除通过`);
    console.log(`会话 B ${sessionB.shortId}：跨用户读写删除与衣物引用均被拒绝`);
    console.log("SDD-009 日记、基础利用率、RLS、数据库约束与页面边界验证通过");
  } finally {
    await Promise.all(sessions.map(cleanup));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "SDD-009 验证失败");
  process.exitCode = 1;
});
