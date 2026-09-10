import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const skins = await readFile(new URL("app/skins.css", root), "utf8");
const boardRule = skins.match(/\.home-collage-board\s*\{[\s\S]*?\n\}/)?.[0];

assert.ok(boardRule, "首页衣橱拼图画板样式必须存在");
assert.match(skins, /--home-collage-board-highlight:/);
assert.match(skins, /--home-collage-board-depth:/);
assert.match(skins, /--home-collage-board-glow-primary:/);
assert.match(skins, /--home-collage-board-glow-secondary:/);
assert.match(boardRule, /background:\s*var\(--home-collage-board\)/);
assert.match(boardRule, /background-image:/);
assert.equal(
  (boardRule.match(/radial-gradient\(/g) ?? []).length,
  2,
  "画板应使用两层克制的局部色晕",
);
assert.equal(
  (boardRule.match(/linear-gradient\(/g) ?? []).length,
  1,
  "画板应使用一层斜向明暗过渡",
);
assert.match(
  boardRule,
  /border:\s*6px solid var\(--home-collage-board-border\)/,
);
assert.doesNotMatch(boardRule, /url\(|animation:/);
assert.match(
  skins,
  /\.app-backdrop\s*\{\s*background:\s*var\(--background\);\s*\}/,
  "App纯色背景不能随画板一起恢复渐变",
);

console.log(
  "SDD-047: layered collage board depth, unchanged solid app background, and white frame passed",
);
