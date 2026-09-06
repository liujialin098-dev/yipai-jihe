import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const deviceSource = read("lib/recommendations/device-location.ts");
const actionSource = read("app/recommendations/actions.ts");
const selectorSource = read(
  "components/recommendations/weather-city-selector.tsx",
);

const { DeviceLocationError, parseDeviceCoordinates, parseDeviceChineseCity } =
  await import("../lib/recommendations/device-location.ts");

assert.deepEqual(
  parseDeviceCoordinates({ latitude: 30.5928, longitude: 114.3055 }),
  { latitude: 30.5928, longitude: 114.3055 },
);
for (const sample of [
  { latitude: "30", longitude: 114 },
  { latitude: 91, longitude: 114 },
  { latitude: 30, longitude: 181 },
  { latitude: Number.NaN, longitude: 114 },
]) {
  assert.throws(
    () => parseDeviceCoordinates(sample),
    (error) => error instanceof DeviceLocationError && error.code === "invalid",
    "非法坐标必须拒绝",
  );
}
assert.equal(
  parseDeviceChineseCity({
    countryCode: "CN",
    lookupSource: "coordinates",
    city: "武汉市",
    locality: "武昌区",
  }),
  "武汉市",
  "应优先使用城市字段而不是区县",
);
assert.equal(
  parseDeviceChineseCity({
    countryCode: "CN",
    lookupSource: "coordinates",
    locality: "昆山市",
  }),
  "昆山市",
  "县级市样本必须可识别",
);
assert.throws(
  () =>
    parseDeviceChineseCity({
      countryCode: "US",
      lookupSource: "coordinates",
      city: "New York",
    }),
  (error) =>
    error instanceof DeviceLocationError && error.code === "outside_china",
  "非中国位置必须拒绝",
);
assert.throws(
  () =>
    parseDeviceChineseCity({
      countryCode: "CN",
      lookupSource: "ipGeolocation",
      city: "武汉市",
    }),
  (error) => error instanceof DeviceLocationError && error.code === "not_found",
  "缺少城市结构必须拒绝",
);

for (const boundary of [
  "/geo/v2/city/lookup?",
  'lang: "zh"',
  'country !== "中国"',
  "parseDeviceCoordinates(input)",
  "requestBrowserWeather",
]) {
  assert.ok(deviceSource.includes(boundary), `城市确认缺少边界：${boundary}`);
}
assert.equal(deviceSource.includes("console."), false, "定位模块不得记录坐标");

const locateStart = selectorSource.indexOf("function locateFromDevice");
const locateEnd = selectorSource.indexOf("\n  return (", locateStart);
const locateBody = selectorSource.slice(locateStart, locateEnd);
assert.ok(locateStart >= 0 && locateEnd > locateStart, "缺少显式定位处理器");
assert.ok(
  locateBody.includes("navigator.geolocation.getCurrentPosition"),
  "定位必须由按钮处理器触发",
);
assert.equal(
  selectorSource.includes("useEffect"),
  false,
  "页面加载不得请求定位",
);
assert.equal(selectorSource.includes("watchPosition"), false, "不得持续定位");
for (const boundary of [
  "enableHighAccuracy: false",
  "timeout: 10_000",
  "maximumAge: 5 * 60 * 1000",
  'onClick={() => locateFromDevice("session")}',
  'onClick={() => locateFromDevice("saved")}',
  "本次使用当前位置",
  "设为常用城市",
  "精确位置不会保存",
  "和风天气",
  "衣拍即合只接收城市名",
  "定位权限被拒绝",
  "定位超时",
  "设备暂时无法提供位置",
  "当前浏览器无法使用定位",
]) {
  assert.ok(selectorSource.includes(boundary), `定位 UI 缺少边界：${boundary}`);
}

const actionStart = actionSource.indexOf(
  "export async function saveDeviceWeatherLocation",
);
const actionEnd = actionSource.indexOf(
  "export async function restoreSavedWeatherCity",
  actionStart,
);
const deviceAction = actionSource.slice(actionStart, actionEnd);
assert.ok(
  actionStart >= 0 && actionEnd > actionStart,
  "缺少设备定位 Server Action",
);
for (const boundary of [
  "supabase.auth.getUser()",
  'formData.get("city")',
  'modeValue !== "session" && modeValue !== "saved"',
  "resolveChineseCity(city)",
  'applyWeatherLocation(supabase, user.id, location, mode, "device")',
]) {
  assert.ok(
    deviceAction.includes(boundary),
    `设备定位动作缺少边界：${boundary}`,
  );
}
for (const forbidden of [
  'formData.get("userId")',
  'formData.get("latitude")',
  'formData.get("longitude")',
  'formData.get("admin1")',
  'formData.get("timezone")',
]) {
  assert.equal(
    deviceAction.includes(forbidden),
    false,
    `动作不得信任：${forbidden}`,
  );
}
assert.ok(
  actionSource.includes('from("daily_recommendations")') &&
    actionSource.includes('.eq("user_id", userId)'),
  "城市切换必须清除当前用户旧推荐",
);
assert.equal(
  selectorSource.includes('formData.set("latitude"'),
  false,
  "设备精确纬度不得提交到衣拍即合服务器",
);
assert.equal(
  selectorSource.includes('formData.set("longitude"'),
  false,
  "设备精确经度不得提交到衣拍即合服务器",
);
assert.ok(
  actionSource.includes("weather_latitude: location.latitude") &&
    actionSource.includes("weather_longitude: location.longitude"),
  "持久化必须使用规范城市中心而不是设备坐标",
);

console.log("SDD-020 device location weather verification passed:");
console.log("- 定位只由用户点击触发，使用城市级低精度单次请求");
console.log("- 设备端把当前坐标换成城市名，应用服务器不接收精确坐标");
console.log("- 本次与常用城市复用既有账号隔离状态，失败保留手动入口");
