import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
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
const { recentHomeDays, homeDiaryItem, homeLookPositions, homePreviewItems } =
  await import(
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
for (let count = 0; count <= 8; count++) {
  const positions = homeLookPositions(count);
  assert.equal(positions.length, count);
  for (const p of positions) {
    assert.ok(p.x - p.width / 2 >= 0 && p.x + p.width / 2 <= 100);
    assert.ok(p.y - p.height / 2 >= 0 && p.y + p.height / 2 <= 100);
  }
}
assert.equal(homeLookPositions(-1).length, 0);
assert.equal(homeLookPositions(NaN).length, 0);
assert.equal(homeLookPositions(99).length, 8);
assert.equal(homeLookPositions(1)[0].x, 50);
const mixedItems = [
  { id: "a", category: "tops", cutoutUrl: "/a.png" },
  { id: "b", category: "tops", cutoutUrl: "/b.png" },
  { id: "c", category: "shoes", cutoutUrl: "/c.png" },
  { id: "d", category: "bottoms", cutoutUrl: "/d.png" },
];
assert.deepEqual(
  homePreviewItems(mixedItems).map((item) => item.id),
  ["a", "c", "d", "b"],
);
assert.equal(homePreviewItems([...mixedItems, ...mixedItems]).length, 4);
assert.deepEqual(
  homePreviewItems(mixedItems.map((i) => ({ ...i, cutoutUrl: null }))),
  [],
);
assert.deepEqual(
  mixedItems.map((item) => item.id),
  ["a", "b", "c", "d"],
);
const page = await read("app/page.tsx");
const home = await read("components/home/daily-edit.tsx");
assert.match(page, /if \(!viewer\)/);
assert.match(page, /AuthEntryGateway/);
assert.match(page, /displayName=\{viewer.displayName\}/);
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
    `${elementImport} export default function Link({prefetch,...p}){return createElement('a',p,p.children)}`,
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
const wardrobe = Array.from({ length: 10 }, (_, i) => ({
  id: `item-${i}`,
  name: `测试单品${i}`,
  category: i % 2 ? "tops" : "shoes",
  imageUrl: `/test-${i}.png`,
  cutoutUrl: `/cutout-${i}.png`,
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
  displayName: "小林",
};
const render = (overrides = {}) =>
  renderToStaticMarkup(createElement(DailyEdit, { ...props, ...overrides }));
assert.match(render(), /还未生成今日搭配/);
assert.equal((render().match(/class="home-look-piece"/g) || []).length, 8);
assert.match(render(), /Hello,/);
const feedMarkup = render();
assert.match(feedMarkup, /href="\/inspiration" class="home-daily-feed"/);
assert.equal((feedMarkup.match(/class="home-daily-feed"/g) || []).length, 1);
assert.ok(
  feedMarkup.indexOf('class="home-daily-feed"') >
    feedMarkup.indexOf('class="home-journal"'),
);
assert.ok(
  feedMarkup.indexOf('class="home-daily-feed"') <
    feedMarkup.indexOf('class="home-save-account"'),
);
assert.match(render({ diaryError: true, anonymous: false }), /每日推送/);
assert.match(render(), /小林/);
assert.match(render({ displayName: "  " }), /朋友/);
assert.match(render({ displayName: "<script>" }), /&lt;script&gt;/);
assert.doesNotMatch(render({ displayName: "<script>" }), /<script>/);
const rawWardrobe = wardrobe.map((item) => ({ ...item, cutoutUrl: null }));
const rawMarkup = render({ data: { ...baseData, items: rawWardrobe } });
assert.match(rawMarkup, /制作衣物贴纸/);
assert.equal((rawMarkup.match(/class="home-look-piece"/g) || []).length, 0);
const partialMarkup = render({
  data: {
    ...baseData,
    items: [wardrobe[0], rawWardrobe[1], rawWardrobe[2]],
    recommendation: {
      outfits: [
        { title: "部分完成的推荐", itemIds: ["item-0", "item-1", "item-2"] },
      ],
    },
  },
});
assert.equal((partialMarkup.match(/class="home-look-piece"/g) || []).length, 1);
assert.match(partialMarkup, /1\/3 件贴纸/);
assert.match(partialMarkup, /还有 2 件待制作/);
assert.doesNotMatch(partialMarkup, /src="\/test-/);
const css = await read("app/globals.css");
assert.doesNotMatch(home, /data-shape/);
assert.match(home, /brand-name-english home-greeting-hello/);
assert.match(
  css,
  /\.home-edit-heading \.home-greeting\s*\{[^}]*justify-content: center/,
);
for (let count = 0; count <= 8; count++) {
  const markup = render({
    data: { ...baseData, items: wardrobe.slice(0, count) },
  });
  assert.equal((markup.match(/class="home-look-piece"/g) || []).length, count);
}
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
  "SDD-037：昵称/转义、类别优先/去重、1～8件排布、日期/代表单品，以及实际组件的无推荐、3～7件推荐、空衣橱、错误、日记与账号状态渲染通过（固定样本，不调用网络）。",
);

// 可选本机视觉样本：使用真实组件与已有透明演示素材，不读取账号或写数据库。
if (process.argv.includes("--preview")) {
  const { createServer } = await import("node:http");
  const chunks = new URL("../.next/dev/static/chunks/", import.meta.url);
  const stylesheets = (await readdir(chunks)).filter((name) =>
    name.endsWith(".css"),
  );
  let stickerCode = ts.transpileModule(
    await read("components/wardrobe/garment-sticker.tsx"),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const stickerImports = {
    "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
    "next/image": dataUrl(
      `${elementImport} export default function Image({fill,unoptimized,sizes,loading,...p}){return createElement('img',{...p,style:fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:p.style})}`,
    ),
    "@/lib/utils": dataUrl(
      "export function cn(...values){return values.filter(Boolean).join(' ')}",
    ),
  };
  for (const [name, url] of Object.entries(stickerImports))
    stickerCode = stickerCode.replaceAll(
      `from "${name}"`,
      `from ${JSON.stringify(url)}`,
    );
  const visualCode = compiled.replace(
    JSON.stringify(imports["@/components/wardrobe/garment-sticker"]),
    JSON.stringify(dataUrl(stickerCode)),
  );
  const { DailyEdit: VisualHome } = await import(dataUrl(visualCode));
  const names = [
    "black-tailored-blazer",
    "ivory-formal-shirt",
    "navy-tailored-trousers",
    "brown-derby-shoes",
  ];
  const sampleItems = names.map((name, i) => ({
    ...wardrobe[i],
    category: name,
    name,
    cutoutUrl: `http://localhost:3000/demo-wardrobe/${name}.webp`,
  }));
  const server = createServer((req, res) => {
    if (req.url !== "/" && req.url !== "/dark") {
      res.writeHead(404);
      res.end("仅用于首页固定视觉样本");
      return;
    }
    const isDark = req.url === "/dark";
    const markup = renderToStaticMarkup(
      createElement(VisualHome, {
        ...props,
        displayName: "小林",
        anonymous: false,
        data: { ...baseData, items: sampleItems },
      }),
    );
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.end(
      `<!doctype html><html class="${isDark ? "dark" : "light"}"><head><meta name="viewport" content="width=device-width,initial-scale=1">${stylesheets.map((name) => `<link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/${name}">`).join("")}</head><body><main class="app-backdrop route-content" style="max-width:460px;margin:auto;overflow-x:clip"><p style="font-size:12px;padding:12px">本地固定样本 · 非真实账号衣橱 <a href="${isDark ? "/" : "/dark"}">切换主题</a></p>${markup}</main></body></html>`,
    );
  });
  server.listen(3011, "127.0.0.1", () =>
    console.log("透明拼图固定样本：http://127.0.0.1:3011（不接入真实数据）"),
  );
}
