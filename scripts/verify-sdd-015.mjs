import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const corePages = [
  "app/page.tsx",
  "app/wardrobe/page.tsx",
  "app/wardrobe/new/page.tsx",
  "app/recommendations/page.tsx",
  "app/diary/page.tsx",
  "app/settings/page.tsx",
  "app/settings/preferences/page.tsx",
  "app/login/page.tsx",
];

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const css = read("app/globals.css");
const pageSources = corePages.map((file) => [file, read(file)]);
const combined = pageSources.map(([, source]) => source).join("\n");

for (const token of [
  ".app-page-meta",
  ".app-page-title",
  ".app-page-lead",
  ".app-section-title",
  ".app-card-title",
  ".app-display-number",
]) {
  assert.ok(css.includes(token), `缺少全局排版 token：${token}`);
}

for (const [file, source] of pageSources) {
  assert.ok(
    source.includes("app-page-title"),
    `${file} 尚未接入统一页面标题层级`,
  );
}

for (const oldPattern of [
  "text-[3.25rem]",
  "text-[4.8rem]",
  "tracking-[-0.075em]",
  "tracking-[-0.09em]",
  'padStart(2, "0")',
  "给这间衣橱，留一把回来的钥匙。",
  "让推荐更像你。",
  "三套，都来自你的衣橱",
]) {
  assert.equal(
    combined.includes(oldPattern),
    false,
    `核心页面仍包含旧模板式排版或文案：${oldPattern}`,
  );
}

assert.equal(/[—–]/u.test(combined), false, "核心页面不应使用装饰性长破折号");
assert.match(css, /font-weight:\s*600/u, "页面标题应使用克制的中等字重");
assert.match(css, /text-wrap:\s*balance/u, "标题应启用自然换行平衡");

console.log("SDD-015 typography verification passed:");
console.log(`- ${corePages.length} 个核心页面已接入统一排版层级`);
console.log("- 已移除超大标题、前导零计数和重复宣传式文案");
console.log("- 标题换行、正文可读性与长破折号边界通过");
