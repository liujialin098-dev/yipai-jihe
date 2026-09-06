import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { parseEnv } from "node:util";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only")
      return { shortCircuit: true, url: "data:text/javascript,export {}" };
    if (specifier.startsWith("@/"))
      return {
        shortCircuit: true,
        url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
      };
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier))
      return next(`${specifier}.ts`, context);
    return next(specifier, context);
  },
});
const developmentEnv = new URL("../.env.development.local", import.meta.url);
if (existsSync(developmentEnv)) {
  const config = parseEnv(readFileSync(developmentEnv, "utf8"));
  for (const [key, value] of Object.entries(config))
    if (key.startsWith("QWEATHER_")) process.env[key] = value;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行真实天气验证。");
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function localDate(date, offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day) + offsetDays,
    ),
  )
    .toISOString()
    .slice(0, 10);
}

async function fetchRealWuhanForecast() {
  const { getWeatherSnapshot } = await import(
    "../lib/recommendations/weather.ts"
  );
  const now = new Date();
  const location = {
    city: "武汉",
    admin1: "湖北",
    latitude: 30.59,
    longitude: 114.3,
    timezone: "Asia/Shanghai",
  };
  const current = await getWeatherSnapshot("today", location, now);
  const tomorrow = await getWeatherSnapshot("tomorrow", location, now);
  ensure(
    current.provider === "qweather" && current.source === "live",
    "今日必须为和风真实天气",
  );
  ensure(tomorrow.targetDate === localDate(now, 1), "明日必须精确匹配日期");
  ensure(tomorrow.temperatureBasis === "air_minimum", "不得编造明日体感");
  return { ...tomorrow, tomorrow: tomorrow.targetDate };
}

async function verifyStaticBoundaries() {
  const [weatherSource, actionSource, controlsSource, dataSource] =
    await Promise.all([
      readFile("lib/recommendations/weather.ts", "utf8"),
      readFile("app/recommendations/actions.ts", "utf8"),
      readFile(
        "components/recommendations/recommendation-controls.tsx",
        "utf8",
      ),
      readFile("lib/recommendations/data.ts", "utf8"),
    ]);
  ensure(!weatherSource.includes("simulatedWeather"), "天气服务仍包含模拟降级");
  ensure(
    !controlsSource.includes('name="weatherPreset"'),
    "页面仍暴露测试天气",
  );
  ensure(
    actionSource.includes("本次不会使用模拟天气"),
    "真实天气失败提示未阻止模拟天气",
  );
  ensure(
    dataSource.includes('weather?.source === "live"'),
    "页面数据层未拒绝旧模拟天气批次",
  );
}

function outfits(marker) {
  return [1, 2, 3].map((slot) => ({
    slot,
    title: `${marker} ${slot}`,
    reason: "SDD-013 日期唯一性测试",
    styleTags: ["minimal"],
    itemIds: [],
  }));
}

async function verifyDateIsolation(realForecast) {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: authData, error: authError } =
    await client.auth.signInAnonymously();
  if (authError || !authData.user) {
    throw new Error(`匿名会话创建失败：${authError?.message ?? "未知错误"}`);
  }
  const userId = authData.user.id;
  const today = localDate(new Date());
  const weather = {
    city: "武汉",
    temperatureC: realForecast.temperatureC,
    apparentTemperatureC: realForecast.apparentTemperatureC,
    weatherCode: realForecast.weatherCode,
    summary: "真实预报测试",
    source: "live",
    observedAt: new Date().toISOString(),
    preset: "live",
  };

  try {
    const rows = [today, realForecast.tomorrow].map((date, index) => ({
      user_id: userId,
      recommendation_date: date,
      occasion: index === 0 ? "commute" : "casual",
      weather,
      outfits: outfits(date),
      source: "rules",
      ai_model: null,
      generation_ms: 20,
    }));
    const insert = await client
      .from("daily_recommendations")
      .upsert(rows, { onConflict: "user_id,recommendation_date" })
      .select("id, recommendation_date");
    ensure(!insert.error, `双日期写入失败：${insert.error?.message}`);
    ensure(insert.data?.length === 2, "今天与明天没有分别保存为两条记录");

    const todayId = insert.data.find(
      (row) => row.recommendation_date === today,
    )?.id;
    const overwrite = await client
      .from("daily_recommendations")
      .upsert(
        { ...rows[0], occasion: "formal" },
        { onConflict: "user_id,recommendation_date" },
      )
      .select("id")
      .single();
    ensure(!overwrite.error, `今日覆盖失败：${overwrite.error?.message}`);
    ensure(overwrite.data?.id === todayId, "同日刷新没有覆盖原批次");

    const finalRows = await client
      .from("daily_recommendations")
      .select("recommendation_date, occasion")
      .eq("user_id", userId)
      .in("recommendation_date", [today, realForecast.tomorrow]);
    ensure(!finalRows.error, "双日期读取失败");
    ensure(finalRows.data?.length === 2, "同日覆盖破坏了明日批次");
  } finally {
    await client.from("daily_recommendations").delete().eq("user_id", userId);
    await client.auth.signOut();
  }
}

async function main() {
  const realForecast = await fetchRealWuhanForecast();
  await Promise.all([
    verifyStaticBoundaries(),
    verifyDateIsolation(realForecast),
  ]);
  console.log(
    `武汉真实明日预报 ${realForecast.tomorrow}：最低 ${realForecast.temperatureC}°C，最高 ${realForecast.temperatureMaxC}°C（和风天气，非体感）`,
  );
  console.log("SDD-013 真实两日天气、禁止模拟与日期隔离验证通过");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "真实天气验证失败");
  process.exitCode = 1;
});
