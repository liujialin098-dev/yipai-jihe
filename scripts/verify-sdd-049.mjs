import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [globals, skins, header, navigation] = await Promise.all([
  readFile(new URL("app/globals.css", root), "utf8"),
  readFile(new URL("app/skins.css", root), "utf8"),
  readFile(new URL("components/status-header.tsx", root), "utf8"),
  readFile(new URL("components/bottom-navigation.tsx", root), "utf8"),
]);

function relativeLuminance(hex) {
  const values = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

assert.match(globals, /--brand-lime:\s*#deefa8/);
assert.match(globals, /--fashion-lime:\s*var\(--brand-lime\)/);
assert.match(globals, /--brand-lime-ink:\s*#352244/);
assert.match(globals, /--header-background:\s*var\(--brand-lime\)/);
assert.match(globals, /--header-foreground:\s*var\(--brand-lime-ink\)/);
assert.ok(
  contrastRatio("#deefa8", "#352244") >= 4.5,
  "青柠顶部导航与深紫前景必须达到正文级对比度",
);

const baseHeader = globals.match(
  /\.editorial-header-shell\s*\{[\s\S]*?\n\}/,
)?.[0];
const darkHeader = globals.match(
  /\.dark \.editorial-header-shell\s*\{[\s\S]*?\n\}/,
)?.[0];
const reducedTransparencyHeader = globals.match(
  /@media \(prefers-reduced-transparency: reduce\) \{\s*\.editorial-header-shell\s*\{[\s\S]*?\n\s*\}/,
)?.[0];
const skinnedHeader = skins.match(
  /:root\[data-skin\]:not\(\[data-skin="original"\]\) \.editorial-header-shell\s*\{[\s\S]*?\n\}/,
)?.[0];

for (const [name, rule] of [
  ["默认顶部导航", baseHeader],
  ["夜间顶部导航", darkHeader],
  ["减少透明顶部导航", reducedTransparencyHeader],
  ["替代皮肤顶部导航", skinnedHeader],
]) {
  assert.ok(rule, `${name}规则必须存在`);
  assert.match(
    rule,
    /background:\s*var\(--header-background\)/,
    `${name}必须复用皮肤导航语义色`,
  );
  assert.doesNotMatch(rule, /linear-gradient\(/, `${name}不得继续使用浅色渐变`);
}

assert.match(
  globals,
  /\.header-icon\s*\{[\s\S]*?color:\s*var\(--header-foreground\)/,
);
assert.match(
  globals,
  /\.brand-lockup\s*\{[\s\S]*?color:\s*var\(--header-foreground\)/,
);
assert.match(
  globals,
  /\.brand-name-chinese\s*\{[\s\S]*?color:\s*var\(--header-foreground\)/,
);
assert.match(
  skins,
  /:root\[data-skin\]:not\(\[data-skin="original"\]\)[\s\S]*?:is\(\.header-icon, \.brand-lockup, \.brand-name-chinese\)\s*\{\s*color:\s*var\(--header-foreground\)/,
);

assert.match(skins, /\.editorial-header-shell,[\s\S]*?min-height:\s*72px/);
assert.match(skins, /--original-add:\s*var\(--brand-lime\)/);
assert.match(skins, /--original-add-ink:\s*var\(--brand-lime-ink\)/);
assert.doesNotMatch(skins, /--skin-header:/);
assert.match(
  skins,
  /:root\[data-skin\]:not\(\[data-skin="original"\]\) \.dock-add\s*\{\s*background:\s*var\(--skin-secondary\)/,
);
assert.match(header, /className="editorial-header-shell/);
assert.match(navigation, /primary \? "nav-icon-shell dock-add"/);

console.log(
  "SDD-049/052: original navigation stays lime; alternatives use skin secondary, with stable geometry",
);
