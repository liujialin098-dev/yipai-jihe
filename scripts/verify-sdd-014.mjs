import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
  {
    OCCASION_PROFILES,
    coreItemJaccard,
    coreRecommendationItemIds,
    evaluateOccasionFit,
    hasOccasionConflict,
  },
  { buildRuleRecommendations, InsufficientWardrobeError },
  { validateRecommendationOutput },
] = await Promise.all([
  import("../lib/wardrobe/catalog.ts"),
  import("../lib/recommendations/occasion-profile.ts"),
  import("../lib/recommendations/rules.ts"),
  import("../lib/recommendations/validation.ts"),
]);

const occasions = ["commute", "casual", "date", "formal"];
const sceneStyles = {
  commute: "commute",
  casual: "casual",
  date: "vintage",
  formal: "elegant",
};
const colors = ["black", "white", "gray", "navy"];

function id(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function fixtureItem(index, overrides) {
  return {
    audience: "male",
    id: id(index),
    name: `固定测试单品 ${index}`,
    category: "tops",
    primary_color: colors[index % colors.length],
    material: "cotton",
    style: "minimal",
    seasons: ["spring", "summer", "autumn", "winter"],
    occasions: ["casual"],
    status: "active",
    ...overrides,
  };
}

function makeSufficientWardrobe() {
  const items = [];
  let nextId = 100;
  for (const occasion of occasions) {
    for (const category of ["tops", "bottoms", "shoes", "outerwear"]) {
      for (let slot = 0; slot < 3; slot += 1) {
        items.push(
          fixtureItem(nextId, {
            name: `${occasion}-${category}-${slot + 1}`,
            category,
            material: category === "shoes" ? "leather" : "cotton",
            style: sceneStyles[occasion],
            seasons:
              category === "outerwear"
                ? ["autumn", "winter"]
                : ["spring", "summer", "autumn", "winter"],
            occasions: [occasion],
          }),
        );
        nextId += 1;
      }
    }
  }
  items.push(
    fixtureItem(nextId, {
      name: "仅运动跑鞋",
      category: "shoes",
      material: "synthetic",
      style: "sporty",
      occasions: ["sport"],
    }),
  );
  return items;
}

function makeWeather(apparentTemperatureC, summary = "晴") {
  return {
    city: "武汉",
    temperatureC: apparentTemperatureC,
    apparentTemperatureC,
    weatherCode: 1,
    summary,
    source: "live",
    observedAt: "2026-08-26T08:00:00.000Z",
    preset: "live",
  };
}

function toRecommendationItems(source) {
  return source.map((item, index) => ({
    audience: item.audience,
    id: id(index + 1),
    name: item.name,
    category: item.category,
    primary_color: item.primaryColor,
    material: item.material,
    style: item.style,
    seasons: item.seasons,
    occasions: item.occasions,
    status: "active",
  }));
}

function assertThreeValidOutfits(items, occasion, weather, outfits) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const profile = OCCASION_PROFILES[occasion];
  assert.equal(outfits.length, 3, `${occasion} 必须生成三套`);
  for (const outfit of outfits) {
    const outfitItems = outfit.itemIds.map((itemId) => itemMap.get(itemId));
    assert.ok(
      evaluateOccasionFit(outfitItems, occasion).passes,
      `${occasion} 第 ${outfit.slot} 套缺少两个独立场景信号`,
    );
    assert.equal(
      outfitItems.some((item) => hasOccasionConflict(item, occasion)),
      false,
      `${occasion} 第 ${outfit.slot} 套包含场景硬冲突单品`,
    );
    for (const item of outfitItems.filter((item) =>
      ["accessories", "outerwear"].includes(item.category),
    )) {
      assert.equal(
        profile.discouragedStyles.includes(item.style),
        false,
        `${occasion} 第 ${outfit.slot} 套不应主动补入不推荐风格的${item.name}`,
      );
    }
  }
  assert.deepEqual(
    validateRecommendationOutput({ outfits }, items, occasion, weather),
    outfits,
    `${occasion} 规则结果必须通过统一校验`,
  );
}

assert.deepEqual(
  Object.keys(OCCASION_PROFILES).sort(),
  [...occasions].sort(),
  "共享画像必须完整覆盖四种场景",
);

const sufficientItems = makeSufficientWardrobe();
const mildWeather = makeWeather(22);
const results = {};
for (const occasion of occasions) {
  results[occasion] = buildRuleRecommendations({
    items: sufficientItems,
    occasion,
    weather: mildWeather,
    preferredStyles: [],
  });
  assertThreeValidOutfits(
    sufficientItems,
    occasion,
    mildWeather,
    results[occasion],
  );
}

const sufficientItemMap = new Map(
  sufficientItems.map((item) => [item.id, item]),
);
const overlapReport = [];
for (let leftIndex = 0; leftIndex < occasions.length; leftIndex += 1) {
  for (
    let rightIndex = leftIndex + 1;
    rightIndex < occasions.length;
    rightIndex += 1
  ) {
    const left = occasions[leftIndex];
    const right = occasions[rightIndex];
    const leftItems = results[left].flatMap((outfit) =>
      outfit.itemIds.map((itemId) => sufficientItemMap.get(itemId)),
    );
    const rightItems = results[right].flatMap((outfit) =>
      outfit.itemIds.map((itemId) => sufficientItemMap.get(itemId)),
    );
    const overlap = coreItemJaccard(
      coreRecommendationItemIds(leftItems),
      coreRecommendationItemIds(rightItems),
    );
    overlapReport.push({ left, right, overlap });
    assert.ok(
      overlap <= 0.5,
      `${left}/${right} 核心单品重合度 ${(overlap * 100).toFixed(1)}% 超过 50%`,
    );
  }
}

const maleDemoItems = toRecommendationItems(
  DEMO_WARDROBE.filter((item) => item.audience !== "female"),
);
for (const occasion of occasions) {
  const outfits = buildRuleRecommendations({
    items: maleDemoItems,
    occasion,
    weather: mildWeather,
    preferredStyles: [],
  });
  assertThreeValidOutfits(maleDemoItems, occasion, mildWeather, outfits);
  assert.equal(
    outfits.some((outfit) =>
      outfit.itemIds.some(
        (itemId) =>
          maleDemoItems.find((item) => item.id === itemId)?.category ===
          "dresses",
      ),
    ),
    false,
    `${occasion} 男装固定样本不得依赖裙装`,
  );
}

const coldWeather = makeWeather(5, "寒冷");
const coldOutfits = buildRuleRecommendations({
  items: sufficientItems,
  occasion: "commute",
  weather: coldWeather,
  preferredStyles: [],
});
assertThreeValidOutfits(sufficientItems, "commute", coldWeather, coldOutfits);
for (const outfit of coldOutfits) {
  assert.ok(
    outfit.itemIds.some(
      (itemId) => sufficientItemMap.get(itemId)?.category === "outerwear",
    ),
    "冷天每套必须包含外套",
  );
}

const hotWeather = makeWeather(32, "炎热");
const hotOutfits = buildRuleRecommendations({
  items: sufficientItems,
  occasion: "formal",
  weather: hotWeather,
  preferredStyles: [],
});
assertThreeValidOutfits(sufficientItems, "formal", hotWeather, hotOutfits);
for (const outfit of hotOutfits) {
  assert.equal(
    outfit.itemIds.some((itemId) => {
      const item = sufficientItemMap.get(itemId);
      return item?.seasons.length === 1 && item.seasons[0] === "winter";
    }),
    false,
    "热天不得选择仅冬季单品",
  );
}

const sportOnlyShoe = sufficientItems.find(
  (item) => item.occasions.length === 1 && item.occasions[0] === "sport",
);
const invalidFormalOutfits = structuredClone(results.formal);
const firstFormalItems = invalidFormalOutfits[0].itemIds;
const formalShoeIndex = firstFormalItems.findIndex(
  (itemId) => sufficientItemMap.get(itemId)?.category === "shoes",
);
firstFormalItems[formalShoeIndex] = sportOnlyShoe.id;
assert.equal(
  validateRecommendationOutput(
    { outfits: invalidFormalOutfits },
    sufficientItems,
    "formal",
    mildWeather,
  ),
  null,
  "统一校验必须拒绝正式场景中的仅运动单品",
);

const minimalItems = sufficientItems.filter(
  (item) =>
    item.occasions.includes("casual") &&
    ["tops", "bottoms", "shoes"].includes(item.category),
);
const minimalOutfits = buildRuleRecommendations({
  items: minimalItems,
  occasion: "casual",
  weather: mildWeather,
  preferredStyles: [],
});
assertThreeValidOutfits(minimalItems, "casual", mildWeather, minimalOutfits);
assert.throws(
  () =>
    buildRuleRecommendations({
      items: minimalItems.slice(0, -1),
      occasion: "casual",
      weather: mildWeather,
      preferredStyles: [],
    }),
  InsufficientWardrobeError,
  "缺少关键鞋类时必须保持既有衣橱不足错误",
);

console.log(
  JSON.stringify(
    {
      scenes: occasions.length,
      outfits: occasions.length * 3,
      overlapReport,
      maleDemoItems: maleDemoItems.length,
      weatherCases: ["mild", "cold", "hot"],
    },
    null,
    2,
  ),
);
console.log("SDD-014 场景差异固定样本通过。");
