import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const base = path.resolve(projectRoot, specifier.slice(2));
    const target = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`].find(
      existsSync,
    );
    if (!target) return nextResolve(specifier, context);
    return { shortCircuit: true, url: pathToFileURL(target).href };
  },
});

const [
  { DEMO_WARDROBE },
  { hasOccasionConflict },
  {
    hasCompleteRainProtectionCandidate,
    isRainyWeatherCode,
    outfitHasCompleteRainProtection,
    rainProtectionRole,
  },
  { buildRuleRecommendations, InsufficientWardrobeError },
  { seasonForTemperature, validateRecommendationOutput },
] = await Promise.all([
  import("../lib/wardrobe/catalog.ts"),
  import("../lib/recommendations/occasion-profile.ts"),
  import("../lib/recommendations/rain-protection.ts"),
  import("../lib/recommendations/rules.ts"),
  import("../lib/recommendations/validation.ts"),
]);

assert.equal(DEMO_WARDROBE.length, 28, "演示衣橱必须补足为 28 件");
assert.equal(
  DEMO_WARDROBE.filter((entry) => entry.audience !== "female").length,
  24,
  "男装/中性演示候选必须有 24 件",
);
for (const entry of DEMO_WARDROBE) {
  assert.equal(
    existsSync(
      path.join(
        projectRoot,
        "public",
        "demo-wardrobe",
        `${entry.demoKey}.webp`,
      ),
    ),
    true,
    `${entry.demoKey} 必须有对应棚拍素材`,
  );
}

const colors = ["black", "white", "gray", "navy"];
let nextId = 1;

function id() {
  const value = `10000000-0000-4000-8000-${String(nextId).padStart(12, "0")}`;
  nextId += 1;
  return value;
}

function item(overrides = {}) {
  return {
    audience: "male",
    id: id(),
    name: "固定测试上装",
    category: "tops",
    primary_color: colors[nextId % colors.length],
    material: "cotton",
    style: "minimal",
    seasons: ["spring", "summer", "autumn", "winter"],
    occasions: ["casual"],
    status: "active",
    ...overrides,
  };
}

function weather(weatherCode, apparentTemperatureC = 22, summary = "有雨") {
  return {
    city: "武汉",
    temperatureC: apparentTemperatureC,
    apparentTemperatureC,
    weatherCode,
    summary,
    source: "live",
    observedAt: "2026-08-27T08:00:00.000Z",
    preset: "live",
  };
}

function makeMixedWardrobe() {
  const sceneStyles = {
    commute: "commute",
    casual: "casual",
    date: "vintage",
    formal: "elegant",
  };
  const items = [];
  for (const occasion of ["commute", "casual", "date", "formal"]) {
    for (const category of ["tops", "bottoms", "shoes", "outerwear"]) {
      for (let index = 0; index < 3; index += 1) {
        items.push(
          item({
            name: `${occasion}-${category}-${index + 1}`,
            category,
            material: category === "shoes" ? "leather" : "cotton",
            style: sceneStyles[occasion],
            occasions: [occasion],
            seasons:
              category === "outerwear"
                ? ["spring", "autumn", "winter"]
                : ["spring", "summer", "autumn", "winter"],
          }),
        );
      }
    }
  }
  return items;
}

const foreignOnlyCases = [
  ["casual", "date"],
  ["casual", "formal"],
  ["casual", "commute"],
  ["date", "casual"],
  ["formal", "casual"],
  ["formal", "commute"],
];
for (const [target, foreign] of foreignOnlyCases) {
  assert.equal(
    hasOccasionConflict(item({ occasions: [foreign] }), target),
    true,
    `${target} 必须拒绝仅 ${foreign} 单品`,
  );
  assert.equal(
    hasOccasionConflict(item({ occasions: [target, foreign] }), target),
    false,
    `${target} 必须保留明确包含当前场景的跨场景基础款`,
  );
}
assert.equal(
  hasOccasionConflict(item({ occasions: ["date"] }), "commute"),
  false,
  "通勤场景不应在本阶段新增排斥范围",
);

for (const code of [51, 61, 67, 80, 82, 95, 99]) {
  assert.equal(isRainyWeatherCode(code), true, `${code} 必须识别为雨天`);
}
for (const code of [0, 3, 45, 71, 77, 85, 86]) {
  assert.equal(isRainyWeatherCode(code), false, `${code} 不得误判为雨天`);
}

const mixedItems = makeMixedWardrobe();
const mildWeather = weather(1, 22, "晴间多云");
for (const occasion of ["casual", "date", "formal"]) {
  const outfits = buildRuleRecommendations({
    items: mixedItems,
    occasion,
    weather: mildWeather,
    preferredStyles: [],
  });
  assert.equal(outfits.length, 3, `${occasion} 必须生成三套`);
  const used = new Set();
  for (const outfit of outfits) {
    for (const itemId of outfit.itemIds) {
      const selected = mixedItems.find((candidate) => candidate.id === itemId);
      assert.ok(selected, "推荐只能引用清单内衣物");
      assert.equal(
        hasOccasionConflict(selected, occasion),
        false,
        `${occasion} 规则结果不得串入 ${selected?.occasions.join("/")}`,
      );
      assert.equal(used.has(itemId), false, "三套之间不得重复单品");
      used.add(itemId);
    }
  }
  assert.deepEqual(
    validateRecommendationOutput(
      { outfits },
      mixedItems,
      occasion,
      mildWeather,
    ),
    outfits,
    `${occasion} 规则结果必须通过统一复验`,
  );
}

const casualOutfits = buildRuleRecommendations({
  items: mixedItems,
  occasion: "casual",
  weather: mildWeather,
  preferredStyles: [],
});
const injectedDateTop = item({
  name: "仅约会上装",
  occasions: ["date"],
  style: "vintage",
});
const mixedWithInjected = [...mixedItems, injectedDateTop];
const invalidAiShape = structuredClone(casualOutfits);
const replacedTopIndex = invalidAiShape[0].itemIds.findIndex(
  (itemId) =>
    mixedItems.find((candidate) => candidate.id === itemId)?.category ===
    "tops",
);
invalidAiShape[0].itemIds[replacedTopIndex] = injectedDateTop.id;
assert.equal(
  validateRecommendationOutput(
    { outfits: invalidAiShape },
    mixedWithInjected,
    "casual",
    mildWeather,
  ),
  null,
  "统一复验必须拒绝结构正确但混入异场景单品的 AI 结果",
);

const casualCore = mixedItems.filter((candidate) =>
  candidate.occasions.includes("casual"),
);
const rainItems = [
  item({
    name: "轻量冲锋衣",
    category: "outerwear",
    material: "synthetic",
    style: "sporty",
    occasions: ["sport"],
  }),
  item({
    name: "防水冲锋裤",
    category: "bottoms",
    material: "synthetic",
    style: "sporty",
    occasions: ["sport"],
  }),
  item({
    name: "防水徒步鞋",
    category: "shoes",
    material: "synthetic",
    style: "sporty",
    occasions: ["sport"],
  }),
];
const rainyWardrobe = [...casualCore, ...rainItems];
const rainyWeather = weather(61, 20);
assert.equal(
  hasCompleteRainProtectionCandidate(
    rainyWardrobe,
    "casual",
    seasonForTemperature(rainyWeather.apparentTemperatureC),
    rainyWeather.apparentTemperatureC,
  ),
  true,
  "完整且合法的防水三件套必须触发雨天优先规则",
);
assert.deepEqual(
  rainItems.map(rainProtectionRole),
  ["outerwear", "bottoms", "shoes"],
  "防水三类角色必须按名称与类别识别",
);

const rainyOutfits = buildRuleRecommendations({
  items: rainyWardrobe,
  occasion: "casual",
  weather: rainyWeather,
  preferredStyles: [],
});
const rainyItemMap = new Map(rainyWardrobe.map((entry) => [entry.id, entry]));
assert.equal(
  rainyOutfits.some((outfit) =>
    outfitHasCompleteRainProtection(outfit, rainyItemMap),
  ),
  true,
  "雨天三套中至少一套必须使用完整防水组合",
);
assert.match(
  rainyOutfits.find((outfit) =>
    outfitHasCompleteRainProtection(outfit, rainyItemMap),
  )?.reason ?? "",
  /完整防水组合/,
  "只有实际使用完整防水组合时才说明防水逻辑",
);

const rainIgnored = structuredClone(rainyOutfits);
const protectedOutfit = rainIgnored.find((outfit) =>
  outfitHasCompleteRainProtection(outfit, rainyItemMap),
);
protectedOutfit.itemIds = protectedOutfit.itemIds.filter(
  (itemId) => rainProtectionRole(rainyItemMap.get(itemId)) !== "outerwear",
);
assert.equal(
  validateRecommendationOutput(
    { outfits: rainIgnored },
    rainyWardrobe,
    "casual",
    rainyWeather,
  ),
  null,
  "库存支持时，忽略完整防水组合的 AI 形态结果必须被拒绝",
);

const incompleteRainWardrobe = rainyWardrobe.filter(
  (entry) => rainProtectionRole(entry) !== "shoes",
);
assert.equal(
  hasCompleteRainProtectionCandidate(
    incompleteRainWardrobe,
    "casual",
    seasonForTemperature(rainyWeather.apparentTemperatureC),
    rainyWeather.apparentTemperatureC,
  ),
  false,
  "缺少任一防水角色时不得触发完整组合硬要求",
);
const incompleteOutfits = buildRuleRecommendations({
  items: incompleteRainWardrobe,
  occasion: "casual",
  weather: rainyWeather,
  preferredStyles: [],
});
assert.equal(incompleteOutfits.length, 3, "防水库存不全仍应生成普通三套");

const dryOutfits = buildRuleRecommendations({
  items: rainyWardrobe,
  occasion: "casual",
  weather: mildWeather,
  preferredStyles: [],
});
assert.equal(
  dryOutfits.some((outfit) =>
    outfitHasCompleteRainProtection(outfit, rainyItemMap),
  ),
  false,
  "非雨天不得给完整防水组合额外优先级",
);

const hotRainWardrobe = rainyWardrobe.map((entry) =>
  rainProtectionRole(entry) === "outerwear"
    ? { ...entry, seasons: ["winter"] }
    : entry,
);
assert.equal(
  hasCompleteRainProtectionCandidate(
    hotRainWardrobe,
    "casual",
    seasonForTemperature(30),
    30,
  ),
  false,
  "炎热雨天不得为凑完整组合使用仅冬季冲锋衣",
);

const insufficient = casualCore.filter(
  (entry) => entry.category !== "shoes" || entry.name.endsWith("-1"),
);
assert.throws(
  () =>
    buildRuleRecommendations({
      items: insufficient,
      occasion: "casual",
      weather: mildWeather,
      preferredStyles: [],
    }),
  InsufficientWardrobeError,
  "衣橱不足时不得放宽场景或完整性边界",
);

const generatorSource = readFileSync(
  path.join(projectRoot, "lib/recommendations/generator.ts"),
  "utf8",
);
assert.ok(
  generatorSource.includes("forbiddenForeignOccasions") &&
    generatorSource.includes("完整防水组合"),
  "AI 提示必须同步场景硬边界和雨天组合要求",
);

console.log(
  JSON.stringify(
    {
      foreignOnlyCases: foreignOnlyCases.length,
      rainyCodes: 7,
      scenes: 3,
      demoWardrobe: DEMO_WARDROBE.length,
      rainProtection: "complete-and-incomplete",
    },
    null,
    2,
  ),
);
console.log("SDD-017 场景一致性与雨天防水搭配固定样本通过。");
