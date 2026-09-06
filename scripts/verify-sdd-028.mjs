import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { generateKeyPairSync, verify } from "node:crypto";
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
const { parseQWeather, qweatherCodeToWmo, parseQWeatherCity, locationKey } =
  await import("../lib/weather/parse.ts");
import { recommendationDate } from "../lib/recommendations/date.ts";

const location = {
  city: "测试城市",
  admin1: "测试省",
  latitude: 30.59,
  longitude: 114.3,
  timezone: "Asia/Shanghai",
};
const now = new Date("2026-12-31T16:01:00Z");
assert.equal(
  recommendationDate(now, location.timezone, "tomorrow"),
  "2027-01-02",
);
const current = {
  temperature: { value: 23.5, unit: "°C" },
  feelsLike: { value: 24, unit: "°C" },
  condition: { code: "305", text: "小雨" },
  metadata: {
    attributions: ["https://developer.qweather.com/attribution.html"],
  },
};
const snapshot = parseQWeather(current, "today", location, now);
assert.equal(snapshot.weatherCode, 61);
assert.equal(snapshot.temperatureBasis, "feels_like");
assert.equal(snapshot.locationKey, locationKey(location));
assert.equal(snapshot.provider, "qweather");
for (const code of ["400", "404", "407", "499"]) {
  assert.ok(qweatherCodeToWmo(code) >= 71 && qweatherCodeToWmo(code) <= 86);
}
for (const code of ["300", "305", "313", "399", "302"])
  assert.ok(qweatherCodeToWmo(code) >= 51);
assert.throws(() => qweatherCodeToWmo("999"));
for (const value of [NaN, Infinity, -61, "23"])
  assert.throws(() =>
    parseQWeather(
      { ...current, temperature: { value, unit: "°C" } },
      "today",
      location,
      now,
    ),
  );
assert.throws(() =>
  parseQWeather(
    { ...current, temperature: { value: 23, unit: "°F" } },
    "today",
    location,
    now,
  ),
);
const day = {
  forecastStartTime: "2027-01-02T00:00+08:00",
  temperatureMin: { value: 12, unit: "°C" },
  temperatureMax: { value: 22, unit: "°C" },
  daytime: { condition: { code: "100", text: "晴" } },
  nighttime: { condition: { code: "305", text: "小雨" } },
};
const daily = parseQWeather({ days: [day] }, "tomorrow", location, now);
assert.equal(daily.targetDate, "2027-01-02");
assert.equal(daily.temperatureBasis, "air_minimum");
assert.equal(daily.temperatureMaxC, 22);
assert.equal(daily.weatherCode, 61, "夜间雨天也需要防水提示");
assert.throws(() =>
  parseQWeather(
    { days: [{ ...day, forecastStartTime: "2027-01-01T00:00+08:00" }] },
    "tomorrow",
    location,
    now,
  ),
);
assert.throws(() =>
  parseQWeather(
    { days: [{ ...day, temperatureMax: { value: 3, unit: "°C" } }] },
    "tomorrow",
    location,
    now,
  ),
);
const geo = {
  code: "200",
  location: [
    {
      name: "武汉",
      adm1: "湖北省",
      country: "中国",
      lat: "30.59",
      lon: "114.30",
      tz: "Asia/Shanghai",
    },
  ],
};
assert.equal(parseQWeatherCity(geo).city, "武汉");
assert.throws(() =>
  parseQWeatherCity({
    ...geo,
    location: [{ ...geo.location[0], country: "美国" }],
  }),
);
assert.throws(() =>
  parseQWeatherCity({ ...geo, location: [{ ...geo.location[0], lat: "" }] }),
);
console.log(
  "SDD-028 pure weather/date/city fixtures passed (synthetic data only).",
);

const read = (file) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const route = read("app/api/weather/session/route.ts");
assert.ok(
  route.includes("auth.getUser()") && route.includes("private, no-store"),
);
assert.ok(
  route.includes("429") && route.includes("403") && route.includes("401"),
);
const client = read("lib/weather/client.ts");
assert.ok(client.includes("Authorization") && client.includes("AbortSignal"));
assert.ok(!client.includes("PRIVATE_KEY") && !client.includes("localStorage"));
const actions = read("app/recommendations/actions.ts");
assert.ok(
  actions.includes("expectedWeatherLocation") &&
    actions.includes("expectedWeatherDate"),
);
assert.ok(!read("lib/recommendations/weather.ts").includes("open-meteo.com"));
assert.ok(
  !read("lib/recommendations/device-location.ts").includes("bigdatacloud.net"),
);
console.log("SDD-028 static security/integration gates passed.");

const { createWeatherCredential } = await import("../lib/weather/auth.ts");
const pair = generateKeyPairSync("ed25519");
const envKeys = [
  "QWEATHER_API_HOST",
  "QWEATHER_DEVELOPER_ID",
  "QWEATHER_PROJECT_ID",
  "QWEATHER_CREDENTIAL_ID",
  "QWEATHER_PRIVATE_KEY",
];
const before = Object.fromEntries(
  envKeys.map((key) => [key, process.env[key]]),
);
try {
  Object.assign(process.env, {
    QWEATHER_API_HOST: "test.re.qweatherapi.com",
    QWEATHER_DEVELOPER_ID: "TESTDEV001",
    QWEATHER_PROJECT_ID: "TESTPRJ001",
    QWEATHER_CREDENTIAL_ID: "TESTKEY001",
    QWEATHER_PRIVATE_KEY: pair.privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
  });
  const result = createWeatherCredential(now.getTime());
  const [header, payload, signature] = result.token.split(".");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.equal(decoded.iss, "TESTDEV001");
  assert.equal(decoded.sub, "TESTPRJ001");
  assert.equal(decoded.exp, Math.floor(now.getTime() / 1000) + 300);
  assert.equal(
    JSON.parse(Buffer.from(header, "base64url").toString()).kid,
    "TESTKEY001",
  );
  assert.ok(
    verify(
      null,
      Buffer.from(`${header}.${payload}`),
      pair.publicKey,
      Buffer.from(signature, "base64url"),
    ),
  );
  process.env.QWEATHER_API_HOST = "evil.example";
  assert.throws(() => createWeatherCredential());
} finally {
  for (const key of envKeys) {
    if (before[key] === undefined) delete process.env[key];
    else process.env[key] = before[key];
  }
}
console.log(
  "SDD-028 short JWT lifetime, claims, signature and host restriction passed (ephemeral test key).",
);
