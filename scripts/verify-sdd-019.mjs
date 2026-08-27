import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const ipSource = read("lib/recommendations/ip-location.ts");
const contextSource = read("lib/recommendations/location-context.ts");
const overrideSource = read("lib/recommendations/location-override.ts");
const dataSource = read("lib/recommendations/data.ts");
const actionSource = read("app/recommendations/actions.ts");
const pageSource = read("app/recommendations/page.tsx");
const selectorSource = read(
  "components/recommendations/weather-city-selector.tsx",
);
const controlsSource = read(
  "components/recommendations/recommendation-controls.tsx",
);

for (const header of [
  "x-vercel-ip-city",
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "x-vercel-ip-latitude",
  "x-vercel-ip-longitude",
  "x-vercel-ip-timezone",
]) {
  assert.ok(ipSource.includes(header), `缺少 Vercel 定位头：${header}`);
}
assert.ok(ipSource.includes("decodeURIComponent"), "编码城市名没有安全解码");
assert.ok(
  ipSource.includes("IP_CITY_SUGGESTION_DISTANCE_KM = 50"),
  "IP 建议没有固定 50 公里防抖门槛",
);
assert.match(ipSource, /country\s*!==\s*"CN"/u, "IP 建议没有限制中国城市");
assert.ok(
  ipSource.includes("locationDistanceKm") &&
    ipSource.includes("Math.atan2") &&
    ipSource.includes("Math.cos"),
  "IP 建议没有使用地理距离判断同城",
);

for (const cookieBoundary of [
  'const WEATHER_LOCATION_COOKIE = "weather-location-override"',
  "httpOnly: true",
  'sameSite: "lax"',
  'path: "/"',
  'secure: process.env.NODE_ENV === "production"',
  "override ?? savedLocation",
]) {
  assert.ok(
    contextSource.includes(cookieBoundary),
    `会话城市缺少边界：${cookieBoundary}`,
  );
}
assert.ok(
  overrideSource.includes("payload.userId !== userId"),
  "临时城市没有绑定当前用户",
);
assert.equal(contextSource.includes("maxAge:"), false, "临时城市不得长期保存");
assert.equal(
  contextSource.includes("expires:"),
  false,
  "临时城市必须随会话失效",
);

for (const dataBoundary of [
  "getWeatherLocationContext",
  "effectiveLocation?.timezone",
  "weather.city === effectiveLocation?.city",
  "weatherSavedCity",
  "usingWeatherCityOverride",
  "ipCitySuggestion",
]) {
  assert.ok(
    dataSource.includes(dataBoundary),
    `页面数据缺少边界：${dataBoundary}`,
  );
}
assert.ok(
  dataSource.includes("{ city: locationContext.ipSuggestion.city }"),
  "页面只能接收待确认城市名，不得序列化 IP 经纬度",
);
assert.equal(
  selectorSource.includes("IpCitySuggestion"),
  false,
  "客户端城市选择器不得接收完整 IP 位置对象",
);

for (const actionBoundary of [
  'formData.get("mode") === "session"',
  "setWeatherLocationOverride(user.id, location)",
  "clearWeatherLocationOverride()",
  "getEffectiveWeatherLocation",
  'from("daily_recommendations")',
  '.eq("user_id", user.id)',
  "restoreSavedWeatherCity",
]) {
  assert.ok(
    actionSource.includes(actionBoundary),
    `城市动作缺少边界：${actionBoundary}`,
  );
}
for (const forbiddenInput of [
  'formData.get("userId")',
  'formData.get("latitude")',
  'formData.get("longitude")',
  'formData.get("timezone")',
]) {
  assert.equal(
    actionSource.includes(forbiddenInput),
    false,
    `城市动作不得信任客户端字段：${forbiddenInput}`,
  );
}

for (const text of [
  "检测到你可能在",
  "本次使用",
  "设为常用城市",
  "恢复",
  "IP 定位可能受 VPN、运营商或网络出口影响",
  "IP 只提供待确认建议，不按 IP 自动切换或覆盖",
]) {
  assert.ok(selectorSource.includes(text), `城市选择器缺少文案：${text}`);
}
assert.ok(pageSource.includes("ipSuggestion={ipCitySuggestion}"));
assert.ok(
  controlsSource.includes("仅使用当前选择城市的"),
  "推荐控件仍把临时城市误称为账号城市",
);

const combinedSource = `${ipSource}\n${contextSource}\n${overrideSource}\n${dataSource}\n${actionSource}`;
for (const forbidden of [
  "x-forwarded-for",
  "request.ip",
  "geolocation.getCurrentPosition",
  '?? "武汉"',
  '?? "北京"',
]) {
  assert.equal(
    combinedSource.includes(forbidden),
    false,
    `实现不得保存 IP、请求设备定位或回退默认城市：${forbidden}`,
  );
}

const { ipCitySuggestion, locationDistanceKm, parseVercelIpCity } =
  await import("../lib/recommendations/ip-location.ts");
const { encodeWeatherLocationOverride, parseWeatherLocationOverride } =
  await import("../lib/recommendations/location-override.ts");

const wuhan = {
  city: "武汉",
  admin1: "湖北",
  latitude: 30.5928,
  longitude: 114.3055,
  timezone: "Asia/Shanghai",
};
const nearWuhan = { latitude: 30.61, longitude: 114.33 };
const hangzhouHeaders = new Headers({
  "x-vercel-ip-country": "CN",
  "x-vercel-ip-city": "%E6%9D%AD%E5%B7%9E",
  "x-vercel-ip-country-region": "ZJ",
  "x-vercel-ip-latitude": "30.2741",
  "x-vercel-ip-longitude": "120.1551",
  "x-vercel-ip-timezone": "Asia/Shanghai",
});
assert.equal(parseVercelIpCity(hangzhouHeaders)?.city, "杭州");
assert.equal(
  parseVercelIpCity(
    new Headers({
      ...Object.fromEntries(hangzhouHeaders),
      "x-vercel-ip-country": "US",
    }),
  ),
  null,
  "非中国 IP 不得产生建议",
);
assert.equal(parseVercelIpCity(new Headers()), null, "缺失 IP 字段应保持安静");
assert.ok(
  locationDistanceKm(wuhan, nearWuhan) < 50,
  "同城样本应被 50 公里门槛过滤",
);
assert.equal(
  ipCitySuggestion(
    new Headers({
      ...Object.fromEntries(hangzhouHeaders),
      "x-vercel-ip-city": "%E6%AD%A6%E6%B1%89",
      "x-vercel-ip-latitude": "30.61",
      "x-vercel-ip-longitude": "114.33",
    }),
    wuhan,
  ),
  null,
  "同城附近位置不得重复提示",
);
assert.equal(ipCitySuggestion(hangzhouHeaders, wuhan)?.city, "杭州");

const encodedOverride = encodeWeatherLocationOverride("user-a", wuhan);
assert.deepEqual(
  parseWeatherLocationOverride(encodedOverride, "user-a"),
  wuhan,
  "匹配用户应恢复本次城市",
);
assert.equal(
  parseWeatherLocationOverride(encodedOverride, "user-b"),
  null,
  "另一账号不得继承本次城市",
);
assert.equal(
  parseWeatherLocationOverride("damaged-cookie", "user-a"),
  null,
  "损坏 Cookie 必须忽略",
);

console.log("SDD-019 IP weather suggestion verification passed:");
console.log("- Vercel IP 字段只产生中国城市待确认建议，不自动覆盖");
console.log("- 本次城市使用账号绑定 HttpOnly 会话 Cookie，另一账号不继承");
console.log("- 推荐读取、日期与生成统一使用当前有效城市且拒绝旧城市天气");
