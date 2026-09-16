import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
function compile(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name in mocks) return mocks[name];
      assert.ok(!name.startsWith("@/") && !name.startsWith("next/"), name);
      return require(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const constants = compile("lib/wardrobe/constants.ts");
const validation = compile("lib/wardrobe/validation.ts", {
  "@/lib/wardrobe/constants": constants,
  "@/lib/personalization/constants": compile(
    "lib/personalization/constants.ts",
  ),
});
let result = { items: [], error: null };
let receivedFilters;
let reads = 0;
const { default: Page } = compile("app/wardrobe/page.tsx", {
  "next/link": {
    default: ({ children, ...props }) =>
      React.createElement("a", props, children),
  },
  "@/components/page-heading": compile("components/page-heading.tsx"),
  "@/components/wardrobe/filter-panel": {
    FilterPanel: () => React.createElement("div", null, "筛选工具"),
  },
  "@/components/wardrobe/item-card": {
    WardrobeItemCard: ({ item }) =>
      React.createElement("article", { "data-item": item.id }, item.name),
  },
  "@/lib/wardrobe/constants": constants,
  "@/lib/wardrobe/validation": validation,
  "@/lib/wardrobe/data": {
    getWardrobeItems: async (filters) => {
      reads++;
      receivedFilters = filters;
      return result;
    },
  },
});
async function render(params = {}) {
  const before = reads;
  const html = renderToStaticMarkup(
    await Page({ searchParams: Promise.resolve(params) }),
  );
  assert.equal(reads, before + 1);
  assert.doesNotMatch(html, /加载演示|补齐演示|演示衣橱|demo-wardrobe/);
  return html;
}
// No viewer dependency: the same empty state applies to anonymous and formal accounts.
const empty = await render();
assert.match(empty, /衣橱还是空的/);
assert.match(empty, /href="\/wardrobe\/new"[^>]*>添加自己的衣物/);
assert.doesNotMatch(empty, /<article|筛选工具/);
result = {
  items: [
    { id: "own", name: "我的衬衫", demo_key: null },
    { id: "legacy", name: "旧衣物", demo_key: "white-shirt" },
  ],
  error: null,
};
const existing = await render();
assert.match(existing, /data-item="own"/);
assert.match(existing, /data-item="legacy"/);
assert.doesNotMatch(existing, /衣橱还是空的/);
result = { items: [], error: null };
assert.match(await render({ q: "衬衫" }), /没有匹配的衣物/);
assert.equal(receivedFilters.q, "衬衫");
assert.match(await render({ status: "archived" }), /还没有归档衣物/);
result = { items: [], error: "读取失败" };
const failure = await render();
assert.match(failure, /衣橱暂时没有打开/);
assert.doesNotMatch(failure, /衣橱还是空的/);

let effects = 0;
const forbidden = () => {
  effects++;
  throw new Error("Unexpected side effect");
};
const { loadDemoWardrobe } = compile("app/wardrobe/actions.ts", {
  "next/cache": { revalidatePath: forbidden },
  "next/navigation": { redirect: forbidden },
  "@/lib/outfits/professional-cutout": { professionalSourcePath: forbidden },
  "@/lib/supabase/server": { createClient: forbidden },
  "@/lib/wardrobe/validation": validation,
});
for (const previous of [
  { status: "idle", message: "" },
  { status: "success", message: "old client" },
]) {
  const state = await loadDemoWardrobe(previous, new FormData());
  assert.equal(state.status, "error");
  assert.match(state.message, /演示衣橱已停用/);
}
assert.equal(
  effects,
  0,
  "Disabled action must not access auth, DB, storage or revalidation",
);
console.log(
  "Empty wardrobe, existing items, filters, error state and retired action zero-effects: PASS (offline)",
);
