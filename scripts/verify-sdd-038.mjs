import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const dataUrl = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const compile = (code) =>
  ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const queueCode = await read("lib/wardrobe/ingestion-stickers.ts");
const queueUrl = dataUrl(compile(queueCode));
const { createIngestionStickerQueue, requestIngestionSticker } = await import(
  queueUrl
);
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
async function until(test) {
  for (let i = 0; i < 100; i++) {
    if (test()) return;
    await tick();
  }
  assert.fail("队列未在测试期限内完成");
}
const events = [];
let active = 0;
let maxActive = 0;
const calls = [];
const q = createIngestionStickerQueue(
  (job, state) => events.push({ ...job, ...state }),
  async (id) => {
    active++;
    maxActive = Math.max(maxActive, active);
    calls.push(id);
    await tick();
    active--;
    if (id === "item-2" && calls.filter((x) => x === id).length === 1)
      throw new Error("503");
    return `https://example.test/${id}.png`;
  },
  0,
);
for (let i = 0; i < 10; i++)
  assert.ok(q.enqueue({ localId: `local-${i}`, itemId: `item-${i}` }));
assert.equal(q.enqueue({ localId: "local-0", itemId: "item-0" }), false);
await until(
  () =>
    events.filter((e) => ["ready", "failed"].includes(e.status)).length === 10,
);
assert.equal(maxActive, 1);
assert.deepEqual(
  calls,
  Array.from({ length: 10 }, (_, i) => `item-${i}`),
);
assert.equal(events.filter((e) => e.status === "failed").length, 1);
assert.equal(q.enqueue({ localId: "local-0", itemId: "item-0" }), false);
assert.ok(q.enqueue({ localId: "local-2", itemId: "item-2" }));
await until(() => events.filter((e) => e.status === "ready").length === 10);
q.dispose();
assert.equal(q.enqueue({ localId: "later", itemId: "later" }), false);

const times = [];
const paced = createIngestionStickerQueue(
  () => {},
  async () => {
    times.push(Date.now());
    return "https://example.test/a.png";
  },
  25,
);
paced.enqueue({ itemId: "a", localId: "a" });
paced.enqueue({ itemId: "b", localId: "b" });
await until(() => times.length === 2);
assert.ok(times[1] - times[0] >= 24);
paced.dispose();
assert.match(queueCode, /gapMs = 4_000/);

let finish;
const exitEvents = [];
const exitCalls = [];
const exiting = createIngestionStickerQueue(
  (_job, state) => exitEvents.push(state.status),
  async (id) => {
    exitCalls.push(id);
    return new Promise((resolve) => {
      finish = resolve;
    });
  },
  0,
);
exiting.enqueue({ localId: "a", itemId: "a" });
exiting.enqueue({ localId: "b", itemId: "b" });
exiting.dispose();
const before = exitEvents.length;
finish("https://example.test/a.png");
await tick();
assert.deepEqual(exitCalls, ["a"]);
assert.equal(exitEvents.length, before);

const originalFetch = globalThis.fetch;
try {
  for (const status of ["created", "reused"]) {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/stickers/items/test");
      assert.equal(init.method, "POST");
      assert.equal(init.credentials, "same-origin");
      assert.ok(init.signal instanceof AbortSignal);
      return Response.json({ status, cutoutUrl: "https://example.test/a.png" });
    };
    assert.equal(
      await requestIngestionSticker("test"),
      "https://example.test/a.png",
    );
  }
  for (const body of [
    null,
    {},
    { status: "error" },
    { status: "created", cutoutUrl: "javascript:alert(1)" },
    { status: "created", cutoutUrl: "/raw.png" },
  ]) {
    globalThis.fetch = async () => Response.json(body);
    await assert.rejects(requestIngestionSticker("test"));
  }
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  await assert.rejects(requestIngestionSticker("test"));
  globalThis.fetch = async () => {
    throw new DOMException("timeout", "TimeoutError");
  };
  await assert.rejects(requestIngestionSticker("test"));
} finally {
  globalThis.fetch = originalFetch;
}

const workspace = await read("components/wardrobe/ingestion-workspace.tsx");
// 直接提取实际confirmItem函数，隔离IO验证单件/批量共用的提交边界。
const ast = ts.createSourceFile(
  "workspace.tsx",
  workspace,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const functions = new Map();
function collect(node) {
  if (ts.isFunctionDeclaration(node) && node.name)
    functions.set(node.name.text, node.getText(ast));
  ts.forEachChild(node, collect);
}
collect(ast);
const confirmSource = `export function makeConfirm({patchItem,stickerQueue,confirming}) {
  ${["confirmItem", "readJson", "isConfirmResponse", "isObject", "errorMessage"].map((name) => functions.get(name)).join("\n")}
  return confirmItem;
}`;
const { makeConfirm } = await import(dataUrl(compile(confirmSource)));
const patches = [];
const enqueued = [];
const confirm = makeConfirm({
  patchItem: (_id, patch) => patches.push(patch),
  confirming: { current: new Set() },
  stickerQueue: { current: { enqueue: (job) => enqueued.push(job) } },
});
const confirmItem = {
  localId: "local",
  ingestionId: "ingestion",
  status: "manual",
  fields: {},
};
try {
  globalThis.fetch = async () =>
    Response.json({ wardrobeItemId: "saved", status: "confirmed" });
  assert.equal(await confirm({ ...confirmItem, ingestionId: null }), false);
  assert.equal(enqueued.length, 0);
  assert.equal(await confirm(confirmItem), true);
  assert.deepEqual(enqueued, [{ localId: "local", itemId: "saved" }]);
  assert.equal(patches.at(-1).status, "confirmed");
  globalThis.fetch = async () =>
    Response.json({ error: { message: "save failed" } }, { status: 500 });
  assert.equal(await confirm(confirmItem), false);
  assert.equal(enqueued.length, 1);
  assert.equal(patches.at(-1).status, "manual");
  let releaseConfirm;
  globalThis.fetch = async () =>
    new Promise((resolve) => {
      releaseConfirm = resolve;
    });
  const firstConfirm = confirm(confirmItem);
  assert.equal(await confirm(confirmItem), false);
  releaseConfirm(Response.json({ wardrobeItemId: "saved-again" }));
  assert.equal(await firstConfirm, true);
  assert.equal(enqueued.length, 2);
} finally {
  globalThis.fetch = originalFetch;
}
assert.match(
  workspace,
  /status: "confirmed",[\s\S]*?stickerQueue.current\?\.enqueue/,
);
assert.match(workspace, /disabled=\{stickerPending > 0 \|\| busy\}/);
assert.match(workspace, /queue.dispose\(\)/);
assert.match(workspace, /confirming.current.has/);
assert.doesNotMatch(
  workspace + queueCode,
  /BAIDU_|professional-cutout|localStorage/,
);
const elementImport = `import {createElement} from ${JSON.stringify(import.meta.resolve("react"))};`;
const imports = {
  "@/components/stickers/outline-controls": dataUrl(
    "export function useStickerOutlineColor(){return 'white'}",
  ),
  "@/lib/stickers/outline": dataUrl(
    compile(await read("lib/stickers/outline.ts")),
  ),
  react: import.meta.resolve("react"),
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "lucide-react": import.meta.resolve("lucide-react"),
  "next/image": dataUrl(
    `${elementImport} export default function Image({fill,unoptimized,...p}){return createElement('img',p)}`,
  ),
  "next/link": dataUrl(
    `${elementImport} export default function Link({prefetch,...p}){return createElement('a',p,p.children)}`,
  ),
  "@/lib/utils": dataUrl(
    "export const cn=(...v)=>v.filter(Boolean).join(' ');",
  ),
  "@/lib/supabase/client": dataUrl(
    "export function createClient(){throw Error('不允许网络')}",
  ),
  "@/lib/personalization/constants": dataUrl(
    compile(await read("lib/personalization/constants.ts")),
  ),
  "@/lib/wardrobe/constants": dataUrl(
    compile(await read("lib/wardrobe/constants.ts")),
  ),
  "@/lib/wardrobe/ingestion-stickers": queueUrl,
};
function replaceImports(code) {
  for (const [name, url] of Object.entries(imports))
    code = code.replaceAll(`from "${name}"`, `from ${JSON.stringify(url)}`);
  return code;
}
imports["@/components/wardrobe/garment-sticker"] = dataUrl(
  replaceImports(
    compile(await read("components/wardrobe/garment-sticker.tsx")),
  ),
);
const { IngestionCard } = await import(
  dataUrl(
    replaceImports(
      compile(
        workspace.replace(
          "function IngestionCard(",
          "export function IngestionCard(",
        ),
      ),
    ),
  )
);
const baseItem = {
  status: "confirmed",
  wardrobeItemId: "test",
  fields: { name: "衬衫" },
  file: { name: "shirt.png", size: 500 },
  previewUrl: "https://example.test/original.png",
};
const noop = () => {};
const renderCard = (status, cutoutUrl = null) =>
  renderToStaticMarkup(
    createElement(IngestionCard, {
      item: { ...baseItem, sticker: { status, cutoutUrl } },
      onPatch: noop,
      onRetry: noop,
      onConfirm: noop,
      onRemove: noop,
      onRetrySticker: noop,
    }),
  );
for (const [status, label] of [
  ["queued", "贴纸排队中"],
  ["processing", "正在制作贴纸"],
  ["failed", "衣物已保存，贴纸暂未完成"],
]) {
  const markup = renderCard(status);
  assert.ok(markup.includes(label));
  assert.ok(markup.includes("original.png"));
  assert.ok(!markup.includes('data-sticker-mode="cutout"'));
  assert.ok(markup.includes("已放入衣橱"));
}
assert.match(renderCard("failed"), /重试贴纸/);
assert.doesNotMatch(renderCard("processing"), /重试贴纸/);
const ready = renderCard("ready", "https://example.test/cutout.png");
assert.match(ready, /data-sticker-mode="cutout"/);
assert.match(ready, /garment-sticker-outline/);
assert.match(ready, /贴纸已就绪/);
assert.doesNotMatch(ready, /original.png/);
console.log(
  "SDD-038：10件串行/去重、间隔、失败重试、退出清理、响应校验和实际卡片状态渲染通过（固定样本，未调用AI或数据库）。",
);
