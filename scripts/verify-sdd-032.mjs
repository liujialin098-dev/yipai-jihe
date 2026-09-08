import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const component = await read("components/wardrobe/garment-sticker.tsx");
assert.match(component, /cutoutUrl \?\? imageUrl/);
assert.match(component, /pointer-events: none|pointer-events-none/);
assert.doesNotMatch(component, /fetch\(|createClient|\.storage|\.from\(/);

const rolloutFiles = [
  "components/home/daily-edit.tsx",
  "app/wardrobe/[id]/page.tsx",
  "app/diary/page.tsx",
  "components/diary/diary-composer.tsx",
  "components/diary/favorites-panel.tsx",
];

for (const path of rolloutFiles) {
  const source = await read(path);
  assert.match(source, /GarmentSticker/, `${path} 未接入共享贴纸组件`);
  assert.match(source, /cutoutUrl=/, `${path} 未传递透明图`);
  assert.match(source, /imageUrl=/, `${path} 未保留原图降级`);
}

const home = await read("components/home/daily-edit.tsx");
assert.match(home, /eager=\{index < 2\}/);
assert.match(home, /看这套搭配/);

const detail = await read("app/wardrobe/[id]/page.tsx");
for (const preservedAction of [
  "FavoriteButton",
  "WardrobeActionButton",
  "编辑",
]) {
  assert.match(detail, new RegExp(preservedAction));
}

const composerPage = await read("app/diary/new/page.tsx");
assert.match(composerPage, /cutoutUrl/);
const composer = await read("components/diary/diary-composer.tsx");
assert.match(composer, /name="itemIds"/);
assert.match(composer, /selectedIds/);
assert.match(composer, /ImageOff/);

const diary = await read("app/diary/page.tsx");
assert.match(diary, /item\.current\?\.cutoutUrl/);
assert.match(diary, /DiaryDeleteButton/);
assert.match(diary, /FavoritesPanel/);

const favorites = await read("components/diary/favorites-panel.tsx");
assert.match(favorites, /FavoriteButton/);
assert.match(favorites, /单品已移除/);

const ingestion = await read("components/wardrobe/ingestion-workspace.tsx");
assert.doesNotMatch(ingestion, /GarmentSticker/);
assert.match(ingestion, /<Image/);

for (const path of rolloutFiles) {
  const source = await read(path);
  assert.doesNotMatch(
    source,
    /professional-cutout|OutfitCanvasEditor|virtual-model|BAIDU_API_KEY/,
  );
}

const packageJson = JSON.parse(await read("package.json"));
assert.equal(
  packageJson.scripts["verify:sdd-032"],
  "node --no-warnings scripts/verify-sdd-032.mjs",
);

console.log("SDD-032：首页、详情、日记、收藏与利用率的衣物贴纸统一边界通过。");
