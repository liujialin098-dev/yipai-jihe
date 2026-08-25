import { readFile } from "node:fs/promises";
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
  const query = new URLSearchParams({
    latitude: "30.5928",
    longitude: "114.3055",
    current: "temperature_2m,apparent_temperature,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max",
    timezone: "Asia/Shanghai",
    forecast_days: "2",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${query}`,
    {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    },
  );
  ensure(response.ok, `Open-Meteo 返回 ${response.status}`);
  const payload = await response.json();
  const tomorrow = localDate(new Date(), 1);
  const index = payload.daily?.time?.indexOf(tomorrow) ?? -1;
  ensure(index >= 0, "真实响应没有精确匹配的明日日期");
  ensure(
    Number.isFinite(payload.current?.temperature_2m) &&
      Number.isFinite(payload.current?.apparent_temperature) &&
      Number.isFinite(payload.current?.weather_code),
    "真实响应缺少今日当前天气字段",
  );
  ensure(
    Number.isFinite(payload.daily?.temperature_2m_min?.[index]) &&
      Number.isFinite(payload.daily?.apparent_temperature_min?.[index]) &&
      Number.isFinite(payload.daily?.weather_code?.[index]),
    "真实响应缺少明日预报字段",
  );
  return {
    tomorrow,
    temperatureC: Math.round(payload.daily.temperature_2m_min[index]),
    apparentTemperatureC: Math.round(
      payload.daily.apparent_temperature_min[index],
    ),
    weatherCode: Math.round(payload.daily.weather_code[index]),
  };
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
    `武汉真实明日预报 ${realForecast.tomorrow}：最低 ${realForecast.temperatureC}°C，最低体感 ${realForecast.apparentTemperatureC}°C`,
  );
  console.log("SDD-013 真实两日天气、禁止模拟与日期隔离验证通过");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "真实天气验证失败");
  process.exitCode = 1;
});
