import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const output = ts.transpileModule(await read("lib/home/presentation.ts"), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { recentHomeDays, homeDiaryItem, homeLookPositions } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
);
assert.deepEqual(recentHomeDays("2026-01-02"), [
  "2025-12-29",
  "2025-12-30",
  "2025-12-31",
  "2026-01-01",
  "2026-01-02",
]);
assert.deepEqual(recentHomeDays("2024-03-02"), [
  "2024-02-27",
  "2024-02-28",
  "2024-02-29",
  "2024-03-01",
  "2024-03-02",
]);
const items = [{ id: "a" }, { id: "b" }];
assert.equal(homeDiaryItem(["a", "b"], items, ["b"]).id, "b");
assert.equal(homeDiaryItem(["removed", "a"], items, []).id, "a");
assert.equal(homeDiaryItem(["another-user"], items, []), null);
assert.equal(homeDiaryItem([], items, []), null);
for (let count = 0; count <= 7; count++) {
  const positions = homeLookPositions(count);
  assert.equal(positions.length, count);
  for (const p of positions) {
    assert.ok(p.x - p.width / 2 >= 0 && p.x + p.width / 2 <= 100);
    assert.ok(p.y - p.height / 2 >= 0 && p.y + p.height / 2 <= 100);
  }
}
const page = await read("app/page.tsx");
const home = await read("components/home/daily-edit.tsx");
assert.match(page, /if \(!viewer\)/);
assert.match(page, /AuthEntryGateway/);
assert.match(page, /getRecommendationPageData\("today"\)/);
assert.match(page, /Promise\.all\(months\.map\(getDiaryMonthData\)\)/);
assert.match(home, /还未生成今日搭配/);
assert.match(home, /diary\/new\?date=\$\{date\}/);
assert.match(home, /diaryError \?/);
assert.match(home, /anonymous \?/);
for (const removed of [
  "原图目录",
  "快速查找",
  "私有维护",
  "当前衣橱",
  "DAILY EDIT",
  "登录后可跨设备使用",
])
  assert.ok(!home.includes(removed));
assert.doesNotMatch(
  page + home,
  /generateRecommendation|recognize|cutoutService|\.insert\(|\.upsert\(/,
);
const weather = await read("components/recommendations/weather-panel.tsx");
assert.match(weather, /if \(compact\)/);
assert.match(weather, /state.status === "ready" && weather/);
assert.match(weather, /天气待刷新/);
assert.match(weather, /天气暂不可用/);
const dataUrl = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const elementImport = `import {createElement} from ${JSON.stringify(import.meta.resolve("react"))};`;
// Test the actual presentation component, without framework IO or weather network calls.
const imports = {
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "lucide-react": import.meta.resolve("lucide-react"),
  "next/link": dataUrl(
    `${elementImport} export default function Link(p){return createElement('a',p,p.children)}`,
  ),
  "@/components/wardrobe/garment-sticker": dataUrl(
    `${elementImport} export function GarmentSticker(p){return createElement('img',{alt:p.alt,src:p.cutoutUrl || p.imageUrl})}`,
  ),
  "@/components/recommendations/weather-panel": dataUrl(
    "export function WeatherPanel(){return null}",
  ),
  "@/lib/home/presentation": dataUrl(output),
};
let compiled = ts.transpileModule(home, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
for (const [name, url] of Object.entries(imports))
  compiled = compiled.replaceAll(
    `from "${name}"`,
    `from ${JSON.stringify(url)}`,
  );
const { DailyEdit } = await import(dataUrl(compiled));
const wardrobe = Array.from({ length: 7 }, (_, i) => ({
  id: `item-${i}`,
  name: `测试单品${i}`,
  imageUrl: `/test-${i}.png`,
  cutoutUrl: null,
}));
const baseData = {
  items: wardrobe,
  recommendation: null,
  error: null,
  itemFavoriteIds: [],
  weatherCity: null,
  targetDate: "2026-09-08",
  viewerId: "test",
};
const props = {
  data: baseData,
  days: recentHomeDays("2026-09-08"),
  entries: [],
  diaryError: false,
  anonymous: true,
};
const render = (overrides = {}) =>
  renderToStaticMarkup(createElement(DailyEdit, { ...props, ...overrides }));
assert.match(render(), /还未生成今日搭配/);
assert.equal((render().match(/class="home-look-piece"/g) || []).length, 3);
assert.equal((render().match(/class="home-journal-day"/g) || []).length, 5);
assert.match(render({ data: { ...baseData, items: [] } }), /添加第一件/);
assert.doesNotMatch(
  render({ data: { ...baseData, items: [], error: "failed" } }),
  /添加第一件/,
);
assert.match(render({ diaryError: true }), /记录暂时未能读取/);
assert.doesNotMatch(render({ anonymous: false }), /保存我的衣橱/);
for (let count = 3; count <= 7; count++) {
  const result = render({
    data: {
      ...baseData,
      recommendation: {
        outfits: [
          {
            title: "测试真实推荐",
            itemIds: wardrobe.slice(0, count).map((i) => i.id),
          },
        ],
      },
    },
  });
  assert.equal((result.match(/class="home-look-piece"/g) || []).length, count);
  assert.match(result, /看这套搭配/);
  assert.doesNotMatch(result, /还未生成今日搭配/);
}
assert.match(
  render({
    entries: [
      { worn_on: "2026-09-08", item_ids: ["item-0"], title: "今天的记录" },
    ],
  }),
  /编辑记录：测试单品0/,
);
console.log(
  "SDD-037：日期/代表单品/排布边界，以及实际组件的无推荐、3～7件推荐、空衣橱、错误、日记与账号状态渲染通过（固定样本，不调用网络）。",
);
