import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
async function load(path) {
  const code = ts.transpileModule(await read(path), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
}
const { primaryNavigation, swipeDestination } = await load(
  "lib/ui/navigation.ts",
);
assert.deepEqual(
  primaryNavigation.map((item) => item.label),
  ["首页", "推荐", "添加", "贴纸", "资讯"],
);
assert.equal(primaryNavigation[2].href, "/wardrobe/new");
assert.equal(primaryNavigation.filter((item) => item.primary).length, 1);
for (const [path, dx, dy, expected] of [
  ["/", -100, 5, "/recommendations"],
  ["/recommendations", 100, 5, "/"],
  ["/recommendations", -100, 5, "/stickers"],
  ["/stickers", -100, 5, "/inspiration"],
  ["/inspiration", 100, 5, "/stickers"],
  ["/", 100, 0, null],
  ["/inspiration", -100, 0, null],
  ["/", -20, 0, null],
  ["/", -100, 90, null],
  ["/wardrobe/new", -200, 0, null],
  ["/diary/new", -200, 0, null],
])
  assert.equal(swipeDestination(path, dx, dy), expected);

const { themeBootstrapScript } = await load("lib/ui/theme.ts");
for (const [saved, system, blocked, expected] of [
  [null, false, false, "light"],
  [null, true, false, "dark"],
  ["light", true, false, "light"],
  ["dark", false, false, "dark"],
  ["invalid", true, false, "dark"],
  [null, true, true, "dark"],
  [null, false, true, "light"],
]) {
  let actual;
  vm.runInNewContext(themeBootstrapScript, {
    localStorage: {
      getItem: () => {
        if (blocked) throw Error("blocked");
        return saved;
      },
    },
    matchMedia: () => ({ matches: system }),
    document: {
      documentElement: {
        classList: {
          add: (value) => {
            actual = value;
          },
        },
      },
    },
  });
  assert.equal(actual, expected);
}
const nav = await read("components/bottom-navigation.tsx");
assert.ok(nav.includes("aria-label="));
assert.doesNotMatch(nav, /nav-primary-bevel/);
const dockCss = await read("app/globals.css");
assert.match(dockCss, /\.dock-add\s*\{[^}]*border-radius: 18px/s);
assert.doesNotMatch(dockCss, /\.nav-primary-bevel/);
assert.doesNotMatch(nav, /<span[^>]*>\{label\}<\/span>/);
const header = await read("components/status-header.tsx");
for (const value of [
  "/diary?view=favorites",
  "ThemeToggle",
  "打开个人主页",
  "打开衣库",
])
  assert.ok(header.includes(value));
const motion = await read("components/page-motion.tsx");
for (const value of [
  "pointercancel",
  "prefers-reduced-motion",
  "interactive",
  "overflowX",
  "28",
  "!event.isPrimary",
])
  assert.ok(motion.includes(value));
const canvas = await read("components/stickers/sticker-canvas.tsx");
for (const value of [
  "取消选择贴纸",
  'setSelectedId("")',
  "Escape",
  "data-no-swipe",
])
  assert.ok(canvas.includes(value));
assert.doesNotMatch(canvas, /setSelectedId\(ids\[0\]/);

function luminance(hex) {
  return hex
    .match(/[\da-f]{2}/g)
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}
for (const [ink, paper] of [
  ["f4eff8", "2b2434"],
  ["c8bcd3", "342b3e"],
  ["b2a6bd", "342b3e"],
  ["e7f5c8", "41492e"],
  ["d5c4e2", "534061"],
]) {
  assert.ok(
    (luminance(ink) + 0.05) / (luminance(paper) + 0.05) >= 4.5,
    `${ink}/${paper} contrast`,
  );
}
console.log(
  "SDD-036：导航顺序、手势方向与保护、主题首屏/存储降级、暗色对比度、取消选择合同通过。",
);
