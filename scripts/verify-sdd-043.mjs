import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
const read = (file) => readFileSync(file, "utf8");
function load(file, deps = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(read(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
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
assert.ok(pieces.some((piece) => piece.x < 15));
assert.ok(pieces.some((piece) => piece.x > 85));
assert.ok(pieces.some((piece) => piece.width >= 78));
assert.equal(pieces.at(-1).x, 52);
assert.equal(
  defaultCollage(items.map((i) => ({ ...i, cutoutUrl: null }))).length,
  0,
);
assert.notEqual(homeCollageKey("viewer-a"), homeCollageKey("viewer-b"));
for (const bad of [
  null,
  {},
  { version: 3 },
  "wrong",
  { version: 1, pieces: [null, {}, { id: "another-user" }] },
])
  assert.deepEqual(restoreCollage(bad, items), pieces);
const corrupt = {
  version: 2,
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
const migrated = restoreCollage({ version: 1, pieces: reversed }, items);
assert.deepEqual(
  migrated.map((piece) => piece.id),
  reversed.map((piece) => piece.id),
);
assert.notDeepEqual(migrated, reversed);
assert.deepEqual(
  restoreCollage({ version: 2, pieces: reversed }, items),
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
assert.match(ui, /version: 2/);
assert.doesNotMatch(ui, /fetch\(|supabase|cutoutService/);
assert.match(read("components/home/daily-edit.tsx"), /href="\/wardrobe"/);
assert.match(read("app/settings/page.tsx"), /<SkinPicker/);
assert.match(read("app/layout.tsx"), /skinBootstrapScript/);
const css = read("app/skins.css");
for (const skin of skins.slice(1))
  assert.ok(css.includes(`[data-skin="${skin.id}"]`));
assert.doesNotMatch(css, /filter:|\.garment-sticker-image\s*\{/);
const { RoundedIcon } = load("components/ui/rounded-icon.tsx");
for (const name of [
  "home",
  "recommendations",
  "add",
  "stickers",
  "inspiration",
  "wardrobe",
  "favorites",
  "moon",
  "sun",
]) {
  const markup = renderToStaticMarkup(createElement(RoundedIcon, { name }));
  assert.match(markup, /viewBox="0 0 24 24"/);
  assert.match(markup, /stroke-linecap="round"/);
  assert.match(markup, /stroke-linejoin="round"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /focusable="false"/);
  assert.doesNotMatch(markup, /NaN|undefined|<image|<filter/);
}
for (const [token, size] of [
  ["header", 24],
  ["feature", 26],
  ["add", 28],
])
  assert.ok(css.includes(`--app-icon-${token}: ${size}px`));
assert.match(css, /\.rounded-icon-tint\s*\{\s*transition: none;/);
const navigation = read("components/bottom-navigation.tsx");
assert.match(navigation, /<RoundedIcon name=\{key\}/);
assert.match(navigation, /aria-current=\{current/);
assert.doesNotMatch(navigation, /strokeWidth=\{current/);
// Bright original colours must stay readable, and must not overwrite other skins.
assert.deepEqual(skins[0].colors, ["#b58af0", "#d8ff52", "#ffffff"]);
assert.deepEqual(
  skins.slice(1).map((skin) => skin.colors),
  [
    ["#a783ee", "#ff9f54", "#ffffff"],
    ["#f09fc8", "#f4cf86", "#ffffff"],
    ["#8fd18f", "#e2f34b", "#ffffff"],
    ["#bfc0c5", "#f0f0eb", "#ffffff"],
    ["#82bff1", "#ff9e5c", "#ffffff"],
  ],
);
function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
for (const [fg, bg] of [
  ["#ffffff", "#7650bb"],
  ["#2c1946", "#cfb2ff"],
  ["#42295f", "#c9aff0"],
  ["#42295f", "#b595e8"],
  ["#f4eaff", "#624388"],
  ["#f4eaff", "#493065"],
  ["#3f2b4d", "#b58af0"],
  ["#d2c3e0", "#302044"],
  ["#3d3742", "#bea2f4"],
  ["#3d3742", "#f3b5d2"],
  ["#3d3742", "#a7dc98"],
  ["#3d3742", "#d0d1d5"],
  ["#3d3742", "#9bcdf3"],
]) {
  const a = luminance(fg),
    b = luminance(bg);
  assert.ok(
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
    `${fg} on ${bg}`,
  );
}
assert.match(css, /\.surface-card\s*\{\s*border-radius: 36px;/);
assert.match(css, /\.field-control\s*\{\s*min-height: 52px;/);
assert.match(css, /\.bottom-navigation-shell\s*\{\s*min-height: 72px;/);
assert.match(
  css,
  /\.icon-dock \.dock-add\s*\{\s*height: 50px;\s*border-radius: 20px;/,
);
assert.ok(
  css.includes(
    ':root:is(:not([data-skin]), [data-skin="original"]) .app-backdrop',
  ),
);
assert.match(
  css,
  /:root:is\(:not\(\[data-skin\]\), \[data-skin="original"\]\) \.app-backdrop\s*\{\s*background: var\(--background\);/,
);
assert.match(
  css,
  /\.home-collage-board\s*\{[^}]*background: var\(--home-collage-board\);/s,
);
assert.match(css, /--home-collage-board:\s*#463452/);
assert.match(css, /--home-collage-board:\s*#382943/);
assert.match(
  css,
  /--home-collage-board:\s*color-mix\(in srgb, var\(--skin-ink\) 52%, #51415b\)/,
);
assert.doesNotMatch(
  css,
  /--home-collage-board:\s*(?:#18131d|#110e15|color-mix\(in srgb, var\(--skin-ink\) 22%, #121014\))/,
);
console.log(
  "SDD-043/044/045: vivid skins, plum collage board, full-bleed migration, rounded icons and UI boundaries passed",
);
