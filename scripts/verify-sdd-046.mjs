import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = new URL("../", import.meta.url);
const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");

async function collectFiles(directory, filename) {
  const entries = await readdir(new URL(`${directory}/`, root), {
    withFileTypes: true,
  });
  const matches = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...(await collectFiles(relativePath, filename)));
    } else if (entry.name === filename) {
      matches.push(relativePath);
    }
  }
  return matches;
}

async function collectSource(directory) {
  const entries = await readdir(new URL(`${directory}/`, root), {
    withFileTypes: true,
  });
  const source = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) {
      source.push(...(await collectSource(relativePath)));
    } else if (/\.(?:tsx|css)$/.test(entry.name)) {
      source.push(await read(relativePath));
    }
  }
  return source;
}

function luminance(hex) {
  const value = hex.slice(1);
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  );
  return channels
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (result, channel, index) =>
        result + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const [globals, skins, brandMotion, ...sourceParts] = await Promise.all([
  read("app/globals.css"),
  read("app/skins.css"),
  read("components/brand-motion.tsx"),
  ...(await collectSource("app")),
  ...(await collectSource("components")),
]);
const source = sourceParts.join("\n");

const outlineAssignments = [
  ...skins.matchAll(/--brand-motion-outline:\s*([^;]+);/g),
];
assert.ok(outlineAssignments.length >= 4);
assert.ok(
  outlineAssignments.every(
    ([, value]) => value.trim().toLowerCase() === "#ffffff",
  ),
  "所有皮肤的品牌动效都必须使用纯白描边",
);
assert.match(
  globals,
  /\.brand-motion-morph img,\s*\.brand-motion-mark-base img\s*\{[\s\S]*drop-shadow\(1px 0 0 var\(--brand-motion-outline, #ffffff\)/,
);
assert.equal(
  (
    globals
      .slice(
        globals.indexOf("/* SDD-041: brand motion */"),
        globals.indexOf("/* End SDD-041 */"),
      )
      .match(/drop-shadow\(/g) ?? []
  ).length,
  4,
);

assert.match(skins, /--home-collage-board-border:\s*#ffffff/);
assert.match(skins, /border:\s*6px solid var\(--home-collage-board-border\)/);

const loadingFiles = await collectFiles("app", "loading.tsx");
assert.deepEqual(loadingFiles.sort(), [
  "app/inspiration/loading.tsx",
  "app/loading.tsx",
  "app/recommendations/loading.tsx",
  "app/stickers/loading.tsx",
]);
for (const loadingFile of loadingFiles) {
  assert.match(await read(loadingFile), /RouteLoading/);
}
assert.match(brandMotion, /export function RouteLoading/);
assert.match(brandMotion, /<BrandMotion variant="loader" label=\{label\} \/>/);

for (const token of [
  "control-primary",
  "control-primary-foreground",
  "feature-panel",
  "feature-panel-foreground",
  "danger-text",
  "danger-surface",
  "success-text",
  "success-surface",
]) {
  assert.match(globals, new RegExp(`--${token}:`));
}
assert.doesNotMatch(source, /bg-\[#1d1d1f\](?!\/)/);
assert.doesNotMatch(source, /#(?:b42318|c9342f|248a3d|9c2f1f|325821)/i);

for (const [foreground, background, minimum] of [
  ["#fcf9ff", "#4a3a5b", 4.5],
  ["#eee6f4", "#4a3a5b", 4.5],
  ["#d9cde2", "#4a3a5b", 4.5],
  ["#ffffff", "#8961b3", 4.5],
  ["#ffb4aa", "#4c2d33", 4.5],
  ["#b9e9ad", "#2e4633", 4.5],
]) {
  assert.ok(
    contrast(foreground, background) >= minimum,
    `${foreground} on ${background} contrast is too low`,
  );
}

console.log(
  "SDD-046: white motion outline, universal route loading, thick white collage frame, semantic controls, and dark contrast passed",
);
