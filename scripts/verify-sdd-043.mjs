import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
const read = (file) => readFileSync(file, "utf8");
function load(file, deps = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => deps[name] ?? require(name),
    module,
    module.exports,
  );
  return module.exports;
}
const presentation = load("lib/home/presentation.ts");
const { defaultCollage, restoreCollage, homeCollageKey, bound } = load(
  "lib/home/collage.ts",
  { "./presentation": presentation },
);
const { skins, validSkin, skinBootstrapScript } = load("lib/ui/skins.ts");
const items = Array.from({ length: 12 }, (_, i) => ({
  id: `item-${i}`,
  name: `衣物${i}`,
  category: i % 2 ? "tops" : "shoes",
  imageUrl: "/original.png",
  cutoutUrl: `/private/${i}.png`,
}));
const pieces = defaultCollage(items);
assert.equal(pieces.length, 8);
assert.equal(
  defaultCollage(items.map((i) => ({ ...i, cutoutUrl: null }))).length,
  0,
);
assert.notEqual(homeCollageKey("viewer-a"), homeCollageKey("viewer-b"));
for (const bad of [
  null,
  {},
  { version: 2 },
  "wrong",
  { version: 1, pieces: [null, {}, { id: "another-user" }] },
])
  assert.deepEqual(restoreCollage(bad, items), pieces);
const corrupt = {
  version: 1,
  pieces: [
    { ...pieces[0], x: Infinity, y: -300, rotate: 999, scale: NaN },
    pieces[0],
    { id: "another-user" },
  ],
};
const safe = restoreCollage(corrupt, items);
assert.equal(safe.length, 1);
assert.equal(safe[0].x, 50);
assert.equal(safe[0].y, 8);
assert.equal(safe[0].rotate, 180);
assert.equal(safe[0].scale, 1);
assert.doesNotMatch(JSON.stringify(safe), /private|imageUrl|cutoutUrl/);
const reversed = [...pieces].reverse();
assert.deepEqual(
  restoreCollage({ version: 1, pieces: reversed }, items),
  reversed,
);
assert.ok(
  restoreCollage({ version: 1, pieces }, items.slice(3)).every(
    (p) => Number(p.id.split("-")[1]) >= 3,
  ),
);
assert.equal(bound("44", 0, 100, 50), 50);
assert.equal(skins.length, 6);
for (const input of [...skins.map((s) => s.id), "url(secret)", null]) {
  const document = { documentElement: { dataset: {} } };
  vm.runInNewContext(skinBootstrapScript, {
    document,
    localStorage: { getItem: () => input },
  });
  assert.equal(document.documentElement.dataset.skin, validSkin(input));
}
const document = { documentElement: { dataset: {} } };
vm.runInNewContext(skinBootstrapScript, {
  document,
  localStorage: {
    getItem: () => {
      throw Error("blocked");
    },
  },
});
assert.equal(document.documentElement.dataset.skin, "original");
const ui = read("components/home/home-collage.tsx");
assert.match(ui, /onPointerCancel/);
assert.match(ui, /data-no-swipe/);
assert.match(ui, /onKeyDown/);
assert.match(ui, /setDraft\(saved\)/);
assert.match(ui, /保存失败/);
assert.doesNotMatch(ui, /fetch\(|supabase|cutoutService/);
assert.match(read("components/home/daily-edit.tsx"), /href="\/wardrobe"/);
assert.match(read("app/settings/page.tsx"), /<SkinPicker/);
assert.match(read("app/layout.tsx"), /skinBootstrapScript/);
const css = read("app/skins.css");
for (const skin of skins.slice(1))
  assert.ok(css.includes(`[data-skin="${skin.id}"]`));
assert.doesNotMatch(css, /filter:|\.garment-sticker-image\s*\{/);
console.log(
  "SDD-043: skins/bootstrap fallback, collage restore/privacy/limits/layers, UI boundaries passed",
);
