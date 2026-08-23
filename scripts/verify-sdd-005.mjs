import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行每日推荐验证。");
}

function createIsolatedClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

const TEST_ITEMS = [
  ["米白针织上衣", "tops", "beige", "knit", "minimal"],
  ["浅蓝棉质衬衫", "tops", "blue", "cotton", "commute"],
  ["灰色休闲上衣", "tops", "gray", "cotton", "casual"],
  ["海军蓝直筒裤", "bottoms", "navy", "denim", "minimal"],
  ["米色通勤长裤", "bottoms", "beige", "cotton", "commute"],
  ["黑色半身裙", "bottoms", "black", "synthetic", "elegant"],
  ["棕色乐福鞋", "shoes", "brown", "leather", "commute"],
  ["白色休闲鞋", "shoes", "white", "leather", "casual"],
  ["黑色短靴", "shoes", "black", "leather", "elegant"],
];

function todayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function recommendationOutfits(itemIds, marker) {
  return [0, 1, 2].map((index) => ({
    slot: index + 1,
    title: `${marker} 推荐 ${index + 1}`,
    reason: "符合当前天气与场合，且三套衣物不重复。",
    styleTags: index === 2 ? ["elegant"] : ["minimal"],
    itemIds: itemIds.slice(index * 3, index * 3 + 3),
  }));
}

function weatherSnapshot(marker) {
  return {
    city: "北京",
    temperatureC: 22,
    apparentTemperatureC: 21,
    weatherCode: 1,
    summary: `晴间多云-${marker}`,
    source: "simulated",
    observedAt: new Date().toISOString(),
    preset: "mild",
  };
}

async function createTestSession(label) {
  const client = createIsolatedClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      `${label} 匿名会话创建失败：${error?.message ?? "未知错误"}`,
    );
  }

  const userId = data.user.id;
  const token = `${Date.now().toString(36)}-${label.toLowerCase()}`;
  const rows = TEST_ITEMS.map(
    ([name, category, primaryColor, material, style], index) => ({
      user_id: userId,
      demo_key: `sdd005-${token}-${index}`,
      name: `${name}-${label}`,
      category,
      primary_color: primaryColor,
      material,
      style,
      seasons: ["spring", "summer", "autumn"],
      occasions: ["commute", "casual", "date", "formal"],
      image_path: `${userId}/sdd-005/${token}-${index}.png`,
    }),
  );

  const insertResult = await client
    .from("wardrobe_items")
    .insert(rows)
    .select("id");
  if (insertResult.error || insertResult.data?.length !== TEST_ITEMS.length) {
    throw new Error(
      `${label} 测试衣橱创建失败：${insertResult.error?.message ?? "数量不正确"}`,
    );
  }

  return {
    client,
    itemIds: insertResult.data.map((item) => item.id),
    shortId: userId.slice(0, 8).toUpperCase(),
    userId,
  };
}

async function upsertRecommendation(session, occasion, marker) {
  const result = await session.client
    .from("daily_recommendations")
    .upsert(
      {
        user_id: session.userId,
        recommendation_date: todayInShanghai(),
        occasion,
        weather: weatherSnapshot(marker),
        outfits: recommendationOutfits(session.itemIds, marker),
        source: "rules",
        ai_model: null,
        generation_ms: 25,
      },
      { onConflict: "user_id,recommendation_date" },
    )
    .select("id, occasion, outfits")
    .single();

  if (result.error || !result.data) {
    throw new Error(
      `推荐 ${marker} 写入失败：${result.error?.message ?? "未知错误"}`,
    );
  }
  return result.data;
}

async function verifySameDayOverwrite(session) {
  const first = await upsertRecommendation(session, "commute", "第一次");
  const second = await upsertRecommendation(session, "casual", "第二次");
  const third = await upsertRecommendation(session, "date", "第三次");
  ensure(
    first.id === second.id && second.id === third.id,
    "同日写入未覆盖同一批次",
  );

  const result = await session.client
    .from("daily_recommendations")
    .select("id, occasion, outfits")
    .eq("recommendation_date", todayInShanghai());
  ensure(!result.error, "读取同日推荐失败");
  ensure(result.data?.length === 1, "同一天存在多批推荐");
  ensure(result.data?.[0]?.occasion === "date", "同日推荐不是最后一次生成结果");
  ensure(result.data?.[0]?.outfits?.length === 3, "推荐结果不是三套");
}

async function verifyCrossUserBlocked(actor, target, label) {
  const readResult = await actor.client
    .from("daily_recommendations")
    .select("id")
    .eq("user_id", target.userId);
  ensure(!readResult.error, `${label} 交叉读取请求异常`);
  ensure(readResult.data?.length === 0, `${label} RLS 未阻止交叉读取`);

  const updateResult = await actor.client
    .from("daily_recommendations")
    .update({ occasion: "formal" })
    .eq("user_id", target.userId)
    .select("id");
  ensure(!updateResult.error, `${label} 交叉更新请求异常`);
  ensure(updateResult.data?.length === 0, `${label} RLS 未阻止交叉更新`);
}

async function verifyThreeOutfitConstraint(session) {
  const result = await session.client.from("daily_recommendations").insert({
    user_id: session.userId,
    recommendation_date: "2099-12-31",
    occasion: "commute",
    weather: weatherSnapshot("非法样本"),
    outfits: recommendationOutfits(session.itemIds, "非法样本").slice(0, 2),
    source: "rules",
    ai_model: null,
    generation_ms: 10,
  });
  ensure(Boolean(result.error), "数据库未拒绝少于三套的推荐结果");
}

async function cleanup(session) {
  await session.client
    .from("daily_recommendations")
    .delete()
    .eq("user_id", session.userId);
  await session.client
    .from("wardrobe_items")
    .delete()
    .in("id", session.itemIds);
}

async function main() {
  const sessions = [];
  try {
    sessions.push(await createTestSession("A"));
    sessions.push(await createTestSession("B"));
    const [sessionA, sessionB] = sessions;

    await Promise.all([
      verifySameDayOverwrite(sessionA),
      verifySameDayOverwrite(sessionB),
    ]);
    await Promise.all([
      verifyCrossUserBlocked(sessionA, sessionB, "A 到 B"),
      verifyCrossUserBlocked(sessionB, sessionA, "B 到 A"),
      verifyThreeOutfitConstraint(sessionA),
    ]);

    console.log(
      `会话 A ${sessionA.shortId}：同日三次覆盖为一批，无法访问会话 B`,
    );
    console.log(
      `会话 B ${sessionB.shortId}：同日三次覆盖为一批，无法访问会话 A`,
    );
    console.log("SDD-005 三套契约、同日覆盖与双会话 RLS 验证通过");
  } finally {
    await Promise.all(sessions.map(cleanup));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "每日推荐验证失败");
  process.exitCode = 1;
});
