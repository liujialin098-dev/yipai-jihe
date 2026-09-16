import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [globals, skins] = await Promise.all([
  readFile(new URL("app/globals.css", root), "utf8"),
  readFile(new URL("app/skins.css", root), "utf8"),
]);

const boardRule = skins.match(/\.home-collage-board\s*\{[\s\S]*?\n\}/)?.[0];
assert.ok(boardRule, "首页衣橱拼图画板样式必须存在");

assert.match(globals, /--brand-lime:\s*#d8ff52/);
assert.match(globals, /--title-home-size:\s*clamp\(1\.75rem, 7vw, 2rem\)/);
assert.match(globals, /--title-home-section-size:\s*1\.25rem/);
assert.match(globals, /--title-home-card-size:\s*1\.0625rem/);
assert.match(globals, /--text-body-size:\s*0\.875rem/);
assert.match(globals, /--text-meta-size:\s*0\.75rem/);
assert.match(
  globals,
  /\.home-edit-heading \.home-greeting\s*\{[\s\S]*font-size:\s*var\(--title-home-size\)/,
);
assert.match(
  globals,
  /\.app-page-title-home\s*\{\s*font-size:\s*var\(--title-home-size\)/,
);
assert.match(
  globals,
  /\.home-daily-edit \.app-section-title\s*\{\s*font-size:\s*var\(--title-home-section-size\)/,
);
assert.match(globals, /\.brand-motion-stage\s*\{[\s\S]*width:\s*5rem/);
assert.match(
  globals,
  /\.brand-motion\[data-variant="splash"\] \.brand-motion-stage\s*\{\s*width:\s*clamp\(8\.25rem, 36vw, 10\.25rem\)/,
);

assert.match(skins, /--home-collage-board-glow-primary:\s*#a783ee/);
assert.match(
  skins,
  /--home-collage-board-glow-secondary:\s*var\(--brand-lime\)/,
);
assert.match(
  skins,
  /--home-collage-board-glow-primary:\s*var\(--skin-accent\)/,
);
assert.match(
  skins,
  /--home-collage-board-glow-secondary:\s*var\(--skin-secondary\)/,
);
assert.match(boardRule, /var\(--home-collage-board-glow-primary\)/);
assert.match(boardRule, /var\(--home-collage-board-glow-secondary\)/);
assert.equal((boardRule.match(/radial-gradient\(/g) ?? []).length, 2);
assert.equal((boardRule.match(/linear-gradient\(/g) ?? []).length, 1);
assert.match(
  boardRule,
  /border:\s*6px solid var\(--home-collage-board-border\)/,
);

assert.match(skins, /--original-add:\s*var\(--brand-lime\)/);
assert.match(
  skins,
  /:root\[data-skin\]:not\(\[data-skin="original"\]\) \.dock-add\s*\{\s*background:\s*var\(--skin-secondary\)/,
);
assert.doesNotMatch(
  skins,
  /:root\[data-skin\]:not\(\[data-skin="original"\]\) \.dock-add\s*\{\s*background:\s*var\(--skin-control\)/,
);

console.log(
  "SDD-048: skin-aware purple/lime board glows, coherent home type scale, larger brand motion and lime add action passed",
);
