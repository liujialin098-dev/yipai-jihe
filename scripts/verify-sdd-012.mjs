import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行个性化验证。");
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

async function createTestSession(label, location, clothingPreference) {
  const client = createIsolatedClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      `${label} 匿名会话创建失败：${error?.message ?? "未知错误"}`,
    );
  }

  const userId = data.user.id;
  const token = `${Date.now().toString(36)}-${label.toLowerCase()}`;
  const [profileResult, preferenceResult] = await Promise.all([
    client.from("profiles").upsert({
      display_name: `个性化测试-${label}`,
      user_id: userId,
    }),
    client.from("user_preferences").upsert({
      user_id: userId,
      clothing_preference: clothingPreference,
      weather_city: location.city,
      weather_admin1: location.admin1,
      weather_latitude: location.latitude,
      weather_longitude: location.longitude,
      weather_timezone: "Asia/Shanghai",
    }),
  ]);
  if (profileResult.error || preferenceResult.error) {
    throw new Error(
      `${label} 资料初始化失败：${profileResult.error?.message ?? preferenceResult.error?.message}`,
    );
  }

  const itemResult = await client
    .from("wardrobe_items")
    .insert([
      {
        user_id: userId,
        demo_key: `sdd012-${token}-dress`,
        name: `SDD-012 女装连衣裙-${label}`,
        audience: "female",
        category: "dresses",
        primary_color: "black",
        material: "synthetic",
        style: "elegant",
        seasons: ["spring"],
        occasions: ["date"],
        image_path: `${userId}/sdd-012/${token}-dress.png`,
      },
      {
        user_id: userId,
        demo_key: `sdd012-${token}-top`,
        name: `SDD-012 中性上衣-${label}`,
        audience: "unisex",
        category: "tops",
        primary_color: "white",
        material: "cotton",
        style: "minimal",
        seasons: ["spring"],
        occasions: ["casual"],
        image_path: `${userId}/sdd-012/${token}-top.png`,
      },
    ])
    .select("id, audience");
  if (itemResult.error || itemResult.data?.length !== 2) {
    throw new Error(
      `${label} 测试衣物创建失败：${itemResult.error?.message ?? "数量错误"}`,
    );
  }

  return {
    client,
    itemIds: itemResult.data.map((item) => item.id),
    shortId: userId.slice(0, 8).toUpperCase(),
    userId,
  };
}

async function verifyOwnPreference(session, expected) {
  const result = await session.client
    .from("user_preferences")
    .select("weather_city, clothing_preference")
    .eq("user_id", session.userId)
    .single();
  ensure(!result.error, "读取自己的城市和衣着偏好失败");
  ensure(result.data?.weather_city === expected.city, "账号城市保存不一致");
  ensure(
    result.data?.clothing_preference === expected.clothingPreference,
    "账号衣着偏好保存不一致",
  );
}

async function verifyCrossUserBlocked(actor, target, label) {
  const readResult = await actor.client
    .from("user_preferences")
    .select("user_id, weather_city")
    .eq("user_id", target.userId);
  ensure(!readResult.error, `${label} 交叉读取请求异常`);
  ensure(readResult.data?.length === 0, `${label} RLS 未阻止交叉读取`);

  const updateResult = await actor.client
    .from("user_preferences")
    .update({ weather_city: "错误城市" })
    .eq("user_id", target.userId)
    .select("user_id");
  ensure(!updateResult.error, `${label} 交叉更新请求异常`);
  ensure(updateResult.data?.length === 0, `${label} RLS 未阻止交叉更新`);
}

async function verifyMaleFilterIsReversible(session) {
  const maleVisible = await session.client
    .from("wardrobe_items")
    .select("id, audience")
    .eq("user_id", session.userId)
    .in("audience", ["male", "unisex"]);
  ensure(!maleVisible.error, "男装衣物筛选失败");
  ensure(maleVisible.data?.length === 1, "男装筛选未排除明确女装");
  ensure(maleVisible.data?.[0]?.audience === "unisex", "中性衣物被错误排除");

  const allItems = await session.client
    .from("wardrobe_items")
    .select("id, audience")
    .eq("user_id", session.userId);
  ensure(!allItems.error, "恢复全部衣物读取失败");
  ensure(allItems.data?.length === 2, "衣着筛选破坏了原衣物记录");
}

async function verifyDatabaseConstraints(session) {
  const invalidPreference = await session.client
    .from("user_preferences")
    .update({ clothing_preference: "invalid" })
    .eq("user_id", session.userId);
  ensure(Boolean(invalidPreference.error), "数据库接受了非法衣着偏好");

  const partialLocation = await session.client
    .from("user_preferences")
    .update({ weather_timezone: null })
    .eq("user_id", session.userId);
  ensure(Boolean(partialLocation.error), "数据库接受了不完整天气位置");
}

async function verifyStaticBoundaries() {
  const [weatherSource, motionSource, catalogSource] = await Promise.all([
    readFile("lib/recommendations/weather.ts", "utf8"),
    readFile("app/globals.css", "utf8"),
    readFile("lib/wardrobe/catalog.ts", "utf8"),
  ]);
  ensure(!weatherSource.includes('DEFAULT_CITY = "北京"'), "天气仍写死北京");
  ensure(
    !motionSource.includes(".motion-button::before"),
    "按钮仍包含横向扫光伪元素",
  );
  ensure(
    catalogSource.includes('item.category === "dresses" ? "female"'),
    "演示裙装未标记女装归属",
  );
}

async function cleanup(session) {
  await session.client
    .from("wardrobe_items")
    .delete()
    .in("id", session.itemIds);
  await session.client.auth.signOut();
}

async function main() {
  const sessions = [];
  try {
    sessions.push(
      await createTestSession(
        "A",
        {
          city: "武汉",
          admin1: "湖北",
          latitude: 30.5928,
          longitude: 114.3055,
        },
        "male",
      ),
    );
    sessions.push(
      await createTestSession(
        "B",
        {
          city: "上海",
          admin1: "上海",
          latitude: 31.2304,
          longitude: 121.4737,
        },
        "female",
      ),
    );
    const [sessionA, sessionB] = sessions;

    await Promise.all([
      verifyOwnPreference(sessionA, {
        city: "武汉",
        clothingPreference: "male",
      }),
      verifyOwnPreference(sessionB, {
        city: "上海",
        clothingPreference: "female",
      }),
      verifyCrossUserBlocked(sessionA, sessionB, "A 到 B"),
      verifyCrossUserBlocked(sessionB, sessionA, "B 到 A"),
      verifyMaleFilterIsReversible(sessionA),
      verifyDatabaseConstraints(sessionA),
      verifyStaticBoundaries(),
    ]);

    console.log(
      `会话 A ${sessionA.shortId}：武汉、男装、可逆过滤与约束验证通过`,
    );
    console.log(`会话 B ${sessionB.shortId}：上海、女装、跨用户访问被拒绝`);
    console.log("SDD-012 城市、衣着偏好、RLS 与按钮动效静态边界验证通过");
  } finally {
    await Promise.all(sessions.map(cleanup));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "个性化验证失败");
  process.exitCode = 1;
});
