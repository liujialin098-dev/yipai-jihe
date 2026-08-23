import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行反馈隔离验证。");
}

function client() {
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

async function createSession(label) {
  const supabase = client();
  const auth = await supabase.auth.signInAnonymously();
  if (auth.error || !auth.data.user) {
    throw new Error(
      `${label} 匿名会话失败：${auth.error?.message ?? "未知错误"}`,
    );
  }
  const userId = auth.data.user.id;
  await supabase.from("user_preferences").upsert({ user_id: userId });
  const item = await supabase
    .from("wardrobe_items")
    .insert({
      user_id: userId,
      demo_key: `sdd006-${label.toLowerCase()}-${Date.now().toString(36)}`,
      name: `反馈测试上衣 ${label}`,
      category: "tops",
      primary_color: label === "A" ? "blue" : "green",
      material: "cotton",
      style: label === "A" ? "minimal" : "casual",
      seasons: ["spring", "summer", "autumn"],
      occasions: ["commute", "casual"],
      image_path: `${userId}/sdd-006/item-${label}.png`,
    })
    .select("id")
    .single();
  if (item.error || !item.data) {
    throw new Error(`${label} 测试衣物创建失败：${item.error?.message}`);
  }
  return {
    supabase,
    userId,
    itemId: item.data.id,
    sourceKey: `sdd006:${label}:1`,
    shortId: userId.slice(0, 8).toUpperCase(),
  };
}

async function verifyIdempotency(session) {
  for (let index = 0; index < 3; index += 1) {
    const itemResult = await session.supabase
      .from("wardrobe_item_favorites")
      .upsert(
        { user_id: session.userId, wardrobe_item_id: session.itemId },
        { onConflict: "user_id,wardrobe_item_id", ignoreDuplicates: true },
      );
    ensure(!itemResult.error, "单品收藏幂等写入失败");

    const outfitResult = await session.supabase.from("outfit_favorites").upsert(
      {
        user_id: session.userId,
        source_key: session.sourceKey,
        title: "测试整套",
        occasion: "commute",
        weather: { summary: "测试天气" },
        outfit: {
          slot: 1,
          title: "测试整套",
          reason: "只用于收藏幂等与隔离验证。",
          styleTags: ["minimal"],
          itemIds: [session.itemId],
        },
      },
      { onConflict: "user_id,source_key", ignoreDuplicates: true },
    );
    ensure(!outfitResult.error, "整套收藏幂等写入失败");

    const eventResult = await session.supabase
      .from("preference_feedback_events")
      .upsert(
        {
          user_id: session.userId,
          event_key: "questionnaire:minimal",
          event_type: "questionnaire",
          style: "minimal",
          weight: 3,
        },
        { onConflict: "user_id,event_key", ignoreDuplicates: true },
      );
    ensure(!eventResult.error, "反馈事件幂等写入失败");
  }

  const [items, outfits, events] = await Promise.all([
    session.supabase
      .from("wardrobe_item_favorites")
      .select("id")
      .eq("wardrobe_item_id", session.itemId),
    session.supabase
      .from("outfit_favorites")
      .select("id")
      .eq("source_key", session.sourceKey),
    session.supabase
      .from("preference_feedback_events")
      .select("id")
      .eq("event_key", "questionnaire:minimal"),
  ]);
  ensure(items.data?.length === 1, "重复单品收藏超过一条");
  ensure(outfits.data?.length === 1, "重复整套收藏超过一条");
  ensure(events.data?.length === 1, "重复问卷事件超过一条");
}

async function verifyCrossBlocked(actor, target, label) {
  const [items, outfits, events] = await Promise.all([
    actor.supabase
      .from("wardrobe_item_favorites")
      .select("id")
      .eq("user_id", target.userId),
    actor.supabase
      .from("outfit_favorites")
      .select("id")
      .eq("user_id", target.userId),
    actor.supabase
      .from("preference_feedback_events")
      .select("id")
      .eq("user_id", target.userId),
  ]);
  ensure(items.data?.length === 0, `${label} 可读取对方单品收藏`);
  ensure(outfits.data?.length === 0, `${label} 可读取对方整套收藏`);
  ensure(events.data?.length === 0, `${label} 可读取对方反馈事件`);

  const crossFavorite = await actor.supabase
    .from("wardrobe_item_favorites")
    .insert({ user_id: actor.userId, wardrobe_item_id: target.itemId });
  ensure(Boolean(crossFavorite.error), `${label} 可收藏对方衣物`);

  const crossPreference = await actor.supabase
    .from("user_preferences")
    .update({ preference_focus: "refined" })
    .eq("user_id", target.userId)
    .select("user_id");
  ensure(
    !crossPreference.error && crossPreference.data?.length === 0,
    `${label} 可修改对方偏好`,
  );
}

async function cleanup(session) {
  await session.supabase
    .from("preference_feedback_events")
    .delete()
    .eq("user_id", session.userId);
  await session.supabase
    .from("outfit_favorites")
    .delete()
    .eq("user_id", session.userId);
  await session.supabase
    .from("wardrobe_item_favorites")
    .delete()
    .eq("user_id", session.userId);
  await session.supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", session.itemId);
}

async function main() {
  const sessions = [];
  try {
    sessions.push(await createSession("A"));
    sessions.push(await createSession("B"));
    const [a, b] = sessions;
    await Promise.all([verifyIdempotency(a), verifyIdempotency(b)]);
    await Promise.all([
      verifyCrossBlocked(a, b, "A 到 B"),
      verifyCrossBlocked(b, a, "B 到 A"),
    ]);
    console.log(`会话 A ${a.shortId}：收藏与反馈幂等，无法访问会话 B`);
    console.log(`会话 B ${b.shortId}：收藏与反馈幂等，无法访问会话 A`);
    console.log("SDD-006 收藏、反馈、偏好和跨用户 RLS 验证通过");
  } finally {
    await Promise.all(sessions.map(cleanup));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "反馈隔离验证失败");
  process.exitCode = 1;
});
