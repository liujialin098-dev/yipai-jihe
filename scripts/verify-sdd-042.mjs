import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const require = createRequire(import.meta.url);
function compile(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(read(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name in mocks) return mocks[name];
      assert.ok(!name.startsWith("@/"), `Unmocked dependency: ${name}`);
      return require(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const { PageHeading } = compile("components/page-heading.tsx");
const render = (title, meta) =>
  renderToStaticMarkup(React.createElement(PageHeading, { title, meta }));
for (const title of [
  "衣物贴纸册",
  "时尚灵感",
  "日记与收藏",
  "衣橱",
  "这是一个足够长的衣物标题用于检查移动端自然换行",
]) {
  const markup = render(title, "9月9日 · 周三");
  assert.equal((markup.match(/<h1/g) ?? []).length, 1);
  assert.match(markup, /class="app-page-heading"/);
  assert.ok(markup.includes(title));
}
assert.doesNotMatch(render("<script>"), /<script>/);
assert.match(render("<script>"), /&lt;script&gt;/);
assert.doesNotMatch(render("衣橱"), /app-page-meta/);

const removed = {
  "components/stickers/sticker-studio.tsx": [
    "排一张今日画板，也回看每月常穿。",
  ],
  "app/inspiration/page.tsx": [
    "只看可信来源",
    "今天值得看的穿搭灵感",
    "DAILY EDIT",
  ],
  "app/diary/page.tsx": [
    "把喜欢的单品和整套搭配收在一起。",
    "记下真正穿过的衣服",
  ],
  "app/wardrobe/page.tsx": ["浏览、筛选和编辑每件衣物。"],
  "app/wardrobe/new/page.tsx": ["选择照片后，系统会填写"],
  "app/wardrobe/[id]/edit/page.tsx": [
    "修改名称、类别和使用场景。原图保持不变。",
  ],
  "app/diary/new/page.tsx": ["只记录真正穿过的衣物，利用率才有参考价值。"],
  "app/settings/preferences/page.tsx": ["设置常用城市、衣着类型和风格"],
  "components/recommendations/trend-inspiration.tsx": [
    "同一套可信来源规则",
    "看最近的趋势、单品与配色",
  ],
};
for (const [file, phrases] of Object.entries(removed)) {
  for (const phrase of phrases)
    assert.ok(!read(file).includes(phrase), `${file}: ${phrase}`);
}
assert.match(
  read("components/stickers/sticker-studio.tsx"),
  /<PageHeading title="衣物贴纸册"/,
);
assert.match(
  read("components/stickers/sticker-studio.tsx"),
  /专业贴纸服务暂时不可用/,
);
assert.match(read("app/wardrobe/new/page.tsx"), /清除站点数据/);
assert.match(read("app/diary/new/page.tsx"), /同一天再次保存会更新/);
assert.match(
  read("components/recommendations/weather-panel.tsx"),
  /正在获取天气/,
);
const css = read("app/globals.css");
for (const level of ["page", "section", "card"]) {
  const rule = css.match(
    new RegExp(`^\\.app-${level}-title \\{([^}]+)\\}`, "m"),
  )?.[1];
  assert.ok(rule?.includes("font-family: var(--title-font)"));
  assert.ok(rule?.includes(`font-size: var(--title-${level}-size)`));
}
assert.doesNotMatch(css, /\.app-page-lead\s*\{[^}]*display:\s*none/);

const noOp = () => null;
const { ReadingControls } = compile(
  "components/inspiration/reading-controls.tsx",
  {
    "@/app/inspiration/actions": {
      setFashionContentRead: async () => ({ ok: true, message: "" }),
    },
  },
);
const { InspirationCard } = compile(
  "components/inspiration/inspiration-card.tsx",
  {
    "@/components/inspiration/reading-controls": { ReadingControls },
    "@/components/inspiration/impression-tracker": { ImpressionTracker: noOp },
    "@/lib/inspiration/validation": { FASHION_TOPIC_LABELS: { trend: "趋势" } },
  },
);
const card = renderToStaticMarkup(
  React.createElement(InspirationCard, {
    index: 0,
    item: {
      id: "fixture",
      title: "样本标题：轻盈的秋日层次",
      topic: "trend",
      publishedAt: "2026-09-09",
      validUntil: "2026-09-10",
      summaryKind: "source-summary",
      summary: "固定排版样本，不是真实新闻。",
      reason: "固定样本推荐依据",
      sourceName: "样本来源",
      sourceUrl: "https://example.com/",
    },
  }),
);
assert.doesNotMatch(
  card,
  /<details|内容详情与时效|来源标题简述|固定样本推荐依据|固定排版样本|展示有效期/,
);
assert.match(card, /标题速览/);
assert.match(card, /阅读原文/);
assert.match(card, /target="_blank"/);
assert.match(card, /rel="noopener noreferrer"/);
assert.match(card, /<time dateTime="2026-09-09"/);
assert.match(card, /样本来源/);
assert.match(card, /2026/);
for (const summaryKind of ["source-summary", "reading-guide", undefined]) {
  const item = {
    id: "fixture",
    title: "<标题>",
    topic: "trend",
    publishedAt: "2026-09-09",
    validUntil: "2026-09-10",
    fetchedAt: "2026-09-09",
    summaryKind,
    summary: "来源标题关注：重复说明",
    reason: "内部排序依据",
    sourceName: "测试来源",
    sourceUrl: "https://example.com/",
    isRead: true,
  };
  const html = renderToStaticMarkup(
    React.createElement(InspirationCard, { item, index: 1, showUnread: false }),
  );
  assert.match(html, /标题速览/);
  assert.match(html, /&lt;标题&gt;/);
  assert.match(html, /设为未读/);
  assert.doesNotMatch(
    html,
    /来源标题关注|内部排序依据|内容详情|展示有效期|2026-09-10|sr-only/,
  );
}
assert.match(
  read("components/inspiration/reading-controls.tsx"),
  /原文已打开，但阅读状态未保存/,
);
assert.match(
  read("components/inspiration/reading-controls.tsx"),
  /disabled=\{pending \|\| opening\}/,
);
console.log(
  "SDD-042：实际标题/资讯卡渲染、转义、统一层级、介绍语移除及必要提示/来源保留通过（无网络固定样本）。",
);

if (process.argv.includes("--preview")) {
  const cssDir = path.join(root, ".next/static/chunks");
  const builtCss = readdirSync(cssDir)
    .filter((p) => p.endsWith(".css"))
    .map((p) => readFileSync(path.join(cssDir, p), "utf8"))
    .join("\n");
  createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:3042");
    res.setHeader("Cache-Control", "no-store");
    if (
      ["/Fredoka-Variable.ttf", "/ZCOOLKuaiLe-Regular.ttf"].includes(
        url.pathname,
      )
    ) {
      res.setHeader("Content-Type", "font/ttf");
      res.end(
        readFileSync(
          path.join(root, "public/fonts", path.basename(url.pathname)),
        ),
      );
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const width = ["320", "375", "844"].includes(url.searchParams.get("width"))
      ? url.searchParams.get("width")
      : "375";
    res.end(
      `<!doctype html><html lang="zh-CN" class="${url.searchParams.get("dark") ? "dark" : "light"}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>042 标题排版样本</title><style>${builtCss}</style><style>@font-face{font-family:FixturePlayful;src:url(/ZCOOLKuaiLe-Regular.ttf)}@font-face{font-family:FixtureRounded;src:url(/Fredoka-Variable.ttf)}:root{--font-playful:FixturePlayful;--font-brand-rounded:FixtureRounded;--font-heading:FixtureRounded,system-ui;--font-sans:FixtureRounded,system-ui}body{margin:0}.sample{width:${width}px;max-width:100%;padding:20px;margin:0 auto;box-sizing:border-box}.sample section{margin-bottom:32px}.sample .page-enter{animation:none}</style><body><main class="sample"><section>${render("衣物贴纸册", "9月9日 · 周三")}<nav aria-label="贴纸册视图" class="mt-6 grid grid-cols-2 rounded-full bg-[var(--surface-soft)] p-1"><button class="h-11">画板</button><button class="h-11">月历</button></nav></section><section class="inspiration-cover rounded-3xl bg-[var(--fashion-lilac)] p-5">${render("时尚灵感")}</section>${card}<section class="mt-6">${render("这是一个足够长的衣物标题用于检查移动端自然换行")}<h2 class="app-section-title mt-6">我的穿搭手帐</h2><h3 class="app-card-title mt-4">今日喜欢的单品</h3><p role="status" class="app-page-lead mt-4">暂时未能读取，请重试。</p></section></main></body></html>`,
    );
  }).listen(3042, "127.0.0.1", () =>
    console.log(
      "042固定视觉样本 http://127.0.0.1:3042/?width=375；?width=320&dark=1；?width=844。仅标题与资讯卡，无账号/外部请求。",
    ),
  );
}
