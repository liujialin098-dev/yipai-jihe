import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const workspaceSource = read("components/wardrobe/ingestion-workspace.tsx");
const citySelectorSource = read(
  "components/recommendations/weather-city-selector.tsx",
);
const recommendationPageSource = read("app/recommendations/page.tsx");
const actionSource = read("app/recommendations/actions.ts");
const foundationMigration = read(
  "supabase/migrations/20260820150709_app_foundation.sql",
);

assert.match(
  workspaceSource,
  /items\.length\s*===\s*MAX_FILES\s*&&\s*confirmedCount\s*===\s*MAX_FILES/u,
  "满批完成状态必须同时要求 10 件队列和 10 件确认",
);
assert.ok(
  workspaceSource.includes("继续添加衣服") &&
    workspaceSource.includes("查看衣橱"),
  "满批后缺少继续添加或查看衣橱入口",
);
assert.match(
  workspaceSource,
  /URL\.revokeObjectURL\(item\.previewUrl\)/u,
  "重置批次前必须释放本地图片预览地址",
);

const resetStart = workspaceSource.indexOf("function resetCompletedBatch()");
const resetEnd = workspaceSource.indexOf(
  "\n  const actionableCount",
  resetStart,
);
const resetBody =
  resetStart >= 0 && resetEnd > resetStart
    ? workspaceSource.slice(resetStart, resetEnd)
    : "";
assert.ok(resetBody, "缺少已完成批次重置函数");
assert.equal(
  resetBody.includes("fetch("),
  false,
  "本地批次重置不得调用删除或其他持久化接口",
);
assert.ok(resetBody.includes("setItems([])"), "批次重置后队列必须为空");

for (const text of [
  "天气城市",
  "选择城市",
  "不按 IP 自动切换",
  "请输入城市名",
]) {
  assert.ok(citySelectorSource.includes(text), `城市选择器缺少文案：${text}`);
}
assert.ok(
  recommendationPageSource.includes("<WeatherCitySelector"),
  "推荐页尚未接入城市选择器",
);

for (const boundary of [
  "supabase.auth.getUser()",
  'formData.get("city")',
  "resolveChineseCity(cityInput)",
  '.eq("user_id", user.id)',
  'from("daily_recommendations")',
  "weather_latitude",
  "weather_longitude",
  "weather_timezone",
]) {
  assert.ok(
    actionSource.includes(boundary),
    `城市保存动作缺少边界：${boundary}`,
  );
}
assert.equal(
  actionSource.includes('formData.get("userId")'),
  false,
  "城市保存动作不得信任客户端用户 ID",
);

assert.ok(
  foundationMigration.includes(
    'create policy "Users can read their own preferences"',
  ) &&
    foundationMigration.includes(
      'create policy "Users can update their own preferences"',
    ) &&
    foundationMigration.includes("with check ((select auth.uid()) = user_id)"),
  "账号偏好缺少 SELECT/UPDATE 所有权 RLS",
);

const locationSources = `${citySelectorSource}\n${actionSource}`;
for (const forbidden of ["x-vercel-ip-city", "request.geo"]) {
  assert.equal(
    locationSources.includes(forbidden),
    false,
    `普通天气城市不得静默使用 IP 或设备定位：${forbidden}`,
  );
}
const locateHandlerStart = citySelectorSource.indexOf(
  "function locateFromDevice",
);
const geolocationCall = citySelectorSource.indexOf(
  "geolocation.getCurrentPosition",
);
assert.ok(
  locateHandlerStart >= 0 && geolocationCall > locateHandlerStart,
  "设备定位只能位于用户点击处理器中",
);
assert.equal(
  citySelectorSource.includes("useEffect"),
  false,
  "天气城市不得在页面加载时静默请求设备定位",
);

console.log("SDD-018 city and batch verification passed:");
console.log("- 10/10 入库后可安全重置本地队列并继续添加");
console.log("- 推荐页可主动选择账号天气城市，明确不按 IP 自动切换");
console.log("- 城市写入使用当前会话、所有权 RLS，并使旧推荐全部失效");
