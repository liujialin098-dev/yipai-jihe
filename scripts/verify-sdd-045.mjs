import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [skins, globals, splashSvg, loaderSvg] = await Promise.all([
  read("app/skins.css"),
  read("app/globals.css"),
  read("public/brand/ensemble-shirt-morph.svg"),
  read("public/brand/ensemble-shirt-morph-loop.svg"),
]);

assert.match(skins, /--home-collage-board:\s*#463452/);
assert.match(skins, /--home-collage-board:\s*#382943/);
assert.equal(
  [...skins.matchAll(/--brand-motion-outline:\s*([^;]+);/g)].every(
    ([, value]) => value.trim().toLowerCase() === "#ffffff",
  ),
  true,
);
assert.match(skins, /border:\s*6px solid var\(--home-collage-board-border\)/);
assert.doesNotMatch(skins, /--home-collage-board:\s*(?:#18131d|#110e15)/);

const motionStart = globals.indexOf("/* SDD-041: brand motion */");
const motionEnd = globals.indexOf("/* End SDD-041 */");
const motionCss = globals.slice(motionStart, motionEnd);
assert.ok(motionStart >= 0 && motionEnd > motionStart);
assert.match(
  motionCss,
  /\.brand-motion-morph img,\s*\.brand-motion-mark-base img\s*\{/,
);
assert.equal((motionCss.match(/drop-shadow\(/g) ?? []).length, 4);
assert.doesNotMatch(motionCss, /drop-shadow\([^)]*\b(?:blur|rgba?)\b/);

for (const svg of [splashSvg, loaderSvg]) {
  assert.match(svg, /fill="#ad95cd"/);
  assert.equal((svg.match(/fill="#d8ff52"/g) ?? []).length, 2);
  assert.doesNotMatch(svg, /attributeName="(?:fill|opacity)"/);
}

console.log(
  "SDD-045: plum collage board and white fixed-color hard-edge brand motion outline passed",
);
