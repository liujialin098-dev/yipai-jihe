import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const nav = await read("components/bottom-navigation.tsx");
const links = [...nav.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(links, [
  "/wardrobe",
  "/recommendations",
  "/wardrobe/new",
  "/inspiration",
  "/favorites",
]);
const header = await read("components/status-header.tsx");
for (const label of ["首页", "穿搭日记", "个人主页"])
  assert.ok(header.includes(label));
const card = await read("components/recommendations/recommendation-card.tsx");
assert.doesNotMatch(card, /OutfitCanvasPreview|\/outfits\/|抠图/);
for (const label of [
  "FavoriteButton",
  "ReplaceItemPanel",
  "RecommendationDiaryButton",
  "item.imageUrl",
])
  assert.ok(card.includes(label));
const profile = await read("lib/profile/data.ts");
assert.doesNotMatch(profile, /outfit_canvases|canvases/);
assert.match(profile, /viewer.userId/);
const confirm = await read("app/api/wardrobe/ingestions/[id]/confirm/route.ts");
assert.doesNotMatch(confirm, /processProfessionalCutout|after\(/);
assert.doesNotMatch(
  await read("components/wardrobe/ingestion-workspace.tsx"),
  /CONFIRM_PACING_MS|透明图将在后台/,
);
for (const path of [
  "app/api/wardrobe/items/[id]/cutout/route.ts",
  "app/api/wardrobe/items/[id]/cutout/source/route.ts",
]) {
  const route = await read(path);
  assert.match(route, /410/);
  assert.doesNotMatch(route, /processProfessionalCutout|createClient|storage/);
}
for (const path of ["app/outfits/new/page.tsx", "app/outfits/[id]/page.tsx"])
  assert.match(await read(path), /redirect\("\/recommendations"\)/);
const css = await read("app/globals.css");
assert.match(css, /--action-purple/);
assert.match(css, /#eee6f5 0%, #f5eff9 44%, #fcfafe 88%/);
assert.doesNotMatch(css, /\.nav-item,\s*\.editorial-nav a/);
assert.match(css, /var\(--font-playful\)/);
assert.match(css, /prefers-reduced-motion/);
console.log("SDD-030：导航、退役入口、原图与隐私边界通过。");

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only")
      return { shortCircuit: true, url: "data:text/javascript,export {}" };
    if (specifier.startsWith("@/"))
      return {
        shortCircuit: true,
        url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
      };
    return next(specifier, context);
  },
});
const {
  qwenConfiguration,
  requestQwenRecommendations,
  recommendationFailureMessage,
} = await import("../lib/recommendations/qwen.ts");
const env = {
  DASHSCOPE_API_KEY: "synthetic-test-key",
  DASHSCOPE_API_HOST: "synthetic.cn-beijing.maas.aliyuncs.com",
};
const isCode = (code) => (error) =>
  error.code === code && error.message === code;
assert.throws(() => qwenConfiguration({}), isCode("not_configured"));
for (const host of [
  "evil.example",
  "https://synthetic.cn-beijing.maas.aliyuncs.com",
  "synthetic.cn-beijing.maas.aliyuncs.com.evil.example",
  "user@synthetic.cn-beijing.maas.aliyuncs.com",
  "localhost",
]) {
  assert.throws(
    () => qwenConfiguration({ ...env, DASHSCOPE_API_HOST: host }),
    isCode("invalid_config"),
  );
}
assert.throws(
  () =>
    qwenConfiguration({ ...env, QWEN_RECOMMENDATION_MODEL: "leak\nprivate" }),
  isCode("invalid_config"),
);
assert.equal(qwenConfiguration(env).model, "qwen3.8-max");
const response = (content, finish_reason = "stop") =>
  Response.json({ choices: [{ finish_reason, message: { content } }] });
let calls = 0;
const result = await requestQwenRecommendations(
  "synthetic prompt",
  { type: "object" },
  {
    env,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(
        url,
        "https://synthetic.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
      );
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.Authorization, "Bearer synthetic-test-key");
      const body = JSON.parse(options.body);
      assert.equal(body.response_format.type, "json_schema");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.enable_thinking, false);
      assert.equal(body.max_tokens, 4096);
      return response('{"outfits":[]}');
    },
  },
);
assert.equal(calls, 1);
assert.deepEqual(result.parsed, { outfits: [] });
for (const [status, code] of [
  [401, "unauthorized"],
  [403, "unauthorized"],
  [429, "rate_limited"],
  [500, "provider_error"],
]) {
  let count = 0;
  await assert.rejects(
    requestQwenRecommendations(
      "",
      {},
      {
        env,
        fetcher: async () => {
          count++;
          return new Response("never disclose this provider body", { status });
        },
      },
    ),
    isCode(code),
  );
  assert.equal(count, 1);
}
for (const payload of [
  null,
  {},
  { choices: [null] },
  { choices: [{ finish_reason: "stop", message: { content: 3 } }] },
]) {
  await assert.rejects(
    requestQwenRecommendations(
      "",
      {},
      { env, fetcher: async () => Response.json(payload) },
    ),
    isCode("invalid_result"),
  );
}
await assert.rejects(
  requestQwenRecommendations(
    "",
    {},
    { env, fetcher: async () => response("not-json") },
  ),
  isCode("invalid_result"),
);
await assert.rejects(
  requestQwenRecommendations(
    "",
    {},
    { env, fetcher: async () => response("{}", "length") },
  ),
  isCode("output_truncated"),
);
await assert.rejects(
  requestQwenRecommendations(
    "",
    {},
    {
      env,
      fetcher: async () => {
        throw new Error("secret-network-detail");
      },
    },
  ),
  isCode("provider_error"),
);
let requestSignal;
await assert.rejects(
  requestQwenRecommendations(
    "",
    {},
    {
      env,
      timeoutMs: 5,
      fetcher: async (_url, options) => {
        requestSignal = options.signal;
        return new Promise(() => {});
      },
    },
  ),
  isCode("timeout"),
);
assert.equal(requestSignal.aborted, true);
for (const code of [
  "not_configured",
  "invalid_config",
  "unauthorized",
  "rate_limited",
  "timeout",
  "provider_error",
  "output_truncated",
  "invalid_result",
])
  assert.ok(recommendationFailureMessage(code));

// 用合成衣橱把模拟供应商响应贯穿到真实业务校验；零网络、零模型费用。
const { generateAiRecommendations } = await import(
  "../lib/recommendations/generator.ts"
);
const items = Array.from({ length: 9 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  name: `合成衣物${i}`,
  brand: "",
  audience: "male",
  category: ["tops", "bottoms", "shoes"][i % 3],
  primary_color: "black",
  material: "cotton",
  style: "casual",
  seasons: ["summer"],
  occasions: ["casual"],
  status: "active",
}));
const outfits = [0, 1, 2].map((i) => ({
  slot: i + 1,
  title: "休闲搭配",
  reason: "轻松出门",
  stylingPoint: "黑色基础款",
  styleTags: ["casual"],
  itemIds: items.slice(i * 3, i * 3 + 3).map((item) => item.id),
}));
const input = {
  items,
  occasion: "casual",
  clothingPreference: "male",
  preferredStyles: [],
  preferredOccasions: [],
  styleDirections: ["casual", "casual", "casual"],
  weather: {
    city: "固定测试城市",
    temperatureC: 28,
    apparentTemperatureC: 28,
    weatherCode: 1,
    summary: "固定晴天样本",
    source: "live",
    observedAt: "2026-09-06T00:00:00Z",
    preset: "live",
  },
};
const previous = {
  fetch: globalThis.fetch,
  info: console.info,
  warn: console.warn,
};
const oldEnv = Object.fromEntries(
  Object.keys(env).map((key) => [key, process.env[key]]),
);
const logs = [];
try {
  Object.assign(process.env, env);
  console.info = (...args) => logs.push(args);
  console.warn = (...args) => logs.push(args);
  globalThis.fetch = async () => response(JSON.stringify({ outfits }));
  const generated = await generateAiRecommendations(input);
  assert.equal(generated.outfits.length, 3);
  assert.equal(generated.model, "qwen3.8-max");
  globalThis.fetch = async () =>
    response(
      JSON.stringify({
        outfits: [
          { ...outfits[0], itemIds: ["foreign-item"] },
          ...outfits.slice(1),
        ],
      }),
    );
  await assert.rejects(
    generateAiRecommendations(input),
    isCode("invalid_result"),
  );
  const serialized = JSON.stringify(logs);
  assert.match(serialized, /invalid_result/);
  assert.doesNotMatch(
    serialized,
    /synthetic-test-key|合成衣物|foreign-item|固定测试城市/,
  );
} finally {
  globalThis.fetch = previous.fetch;
  console.info = previous.info;
  console.warn = previous.warn;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
const generator = await read("lib/recommendations/generator.ts");
assert.doesNotMatch(generator, /OPENAI_API_KEY|requestOpenAiResponse/);
const actions = await read("app/recommendations/actions.ts");
assert.match(actions, /recommendationFailureMessage\(failureCode\)/);
console.log(
  "SDD-030：千问请求契约、截止时间、失败分类、无重试、三套业务复验与日志保密通过（模拟接口）。",
);
