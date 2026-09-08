import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const compile = (code) =>
  ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const code = compile(await read("lib/stickers/outline.ts"));
const { solidOutlineAlpha, outlinePalette, STICKER_OUTLINE_COLORS } =
  await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
const rgba = new Uint8ClampedArray(11 * 11 * 4);
rgba[(5 * 11 + 5) * 4 + 3] = 255;
const original = rgba.slice();
const mask = solidOutlineAlpha(rgba, 11, 11, 3);
assert.deepEqual(rgba, original);
for (let y = 0; y < 11; y++)
  for (let x = 0; x < 11; x++) {
    assert.equal(mask[y * 11 + x], (x - 5) ** 2 + (y - 5) ** 2 <= 9 ? 255 : 0);
  }
rgba[(5 * 11 + 5) * 4 + 3] = 127;
assert.ok(solidOutlineAlpha(rgba, 11, 11, 3).every((a) => a === 0));
rgba[(5 * 11 + 5) * 4 + 3] = 128;
assert.deepEqual(solidOutlineAlpha(rgba, 11, 11, 3), mask);
assert.throws(() => solidOutlineAlpha(rgba, 12, 11, 3), /invalid_mask/);
assert.throws(() => solidOutlineAlpha(rgba, 11, 11, NaN), /invalid_mask/);
assert.throws(() => solidOutlineAlpha(rgba, 513, 11, 3), /invalid_mask/);
const dense = new Uint8ClampedArray(512 * 512 * 4).fill(255);
const start = performance.now();
assert.ok(solidOutlineAlpha(dense, 512, 512, 11).every((a) => a === 255));
console.log(
  `512px实心遮罩耗时：${Math.round(performance.now() - start)}ms（本机Node，不代表手机性能）`,
);
assert.equal(STICKER_OUTLINE_COLORS.length, 6);
assert.equal(outlinePalette(undefined).color, "#ffffff");
assert.equal(outlinePalette("url(secret)").value, "white");
for (const item of STICKER_OUTLINE_COLORS)
  assert.equal(outlinePalette(item.value), item);
const css = await read("app/globals.css");
const sticker = await read("components/wardrobe/garment-sticker.tsx");
const controls = await read("components/stickers/outline-controls.tsx");
const exporter = await read("lib/stickers/export.ts");
assert.match(sticker, /loadOutlineMask\(cutoutUrl\)/);
assert.match(sticker, /mask\?\.source === source/);
assert.match(controls, /aria-pressed/);
assert.match(controls, /aria-label/);
assert.match(controls, /localStorage/);
assert.match(css, /mask-origin: content-box/);
assert.doesNotMatch(exporter, /shadowBlur|shadowOffset|brightness|blur\(/);
assert.match(
  exporter,
  /createSolidOutline\(\s*bitmap,\s*outlinePalette\(outlineColor\).color,?\s*\)/,
);
assert.match(exporter, /outlineColor = "white"/);
assert.doesNotMatch(code, /BAIDU_|OPENAI_|supabase|insert\(/);
// Exercise the actual preference store without calling React hooks or a browser.
const dataUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
let storeCode = ts.transpileModule(
  `${controls}\nexport {readColor,setColor,subscribe,syncStorage};`,
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
for (const [name, url] of Object.entries({
  react: import.meta.resolve("react"),
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "lucide-react": import.meta.resolve("lucide-react"),
  "@/lib/stickers/outline": dataUrl(code),
}))
  storeCode = storeCode.replaceAll(
    `from "${name}"`,
    `from ${JSON.stringify(url)}`,
  );
const memory = new Map();
const events = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
globalThis.window = {
  addEventListener: (key, handler) => events.set(key, handler),
  removeEventListener: (key) => events.delete(key),
};
const store = await import(dataUrl(storeCode));
assert.equal(store.readColor(), "white");
let notifications = 0;
const unsubscribe = store.subscribe(() => notifications++);
store.setColor("lilac");
assert.equal(store.readColor(), "lilac");
assert.equal(memory.get("ensemble-sticker-outline-v1"), "lilac");
memory.set("ensemble-sticker-outline-v1", "ink");
store.syncStorage({ key: "ensemble-sticker-outline-v1" });
assert.equal(store.readColor(), "ink");
globalThis.localStorage.setItem = () => {
  throw new Error("storage_denied");
};
store.setColor("white");
assert.equal(store.readColor(), "white");
assert.equal(notifications, 3);
unsubscribe();
assert.equal(events.size, 0);
delete globalThis.window;
delete globalThis.localStorage;
console.log(
  "SDD-039：圆盘轮廓、0/255实心alpha、阈值、越界保护、六色、默认白、无阴影导出与客户端密钥边界通过。首页0～8件实际组件渲染由037回归覆盖。",
);

// Explicit local visual fixture: real shared algorithm/CSS, synthetic clothing assets,
// no private account, no provider call. Does not claim a hydrated product E2E.
if (process.argv.includes("--preview")) {
  const { createServer } = await import("node:http");
  const sharp = (await import("sharp")).default;
  const names = (
    await readdir(new URL("../public/demo-wardrobe/", import.meta.url))
  )
    .filter((n) => n.endsWith(".webp"))
    .slice(0, 8);
  const positionsCode = compile(await read("lib/home/presentation.ts"));
  const { homeLookPositions } = await import(
    `data:text/javascript;base64,${Buffer.from(positionsCode).toString("base64")}`
  );
  const positions = homeLookPositions(8);
  const paths = [
    "M150 100 L225 75 Q256 130 287 75 L362 100 L446 190 L374 240 L348 202 L348 450 L164 450 L164 202 L138 240 L66 190 Z",
    "M174 65 L338 65 L363 440 L275 447 L256 200 L237 447 L149 440 Z",
    "M100 210 Q165 230 200 195 L250 135 L305 265 Q365 300 430 310 L448 365 Q440 405 370 400 L85 395 Q56 370 70 335 Z",
    "M135 200 L377 200 L410 430 L102 430 Z M183 200 L183 145 Q256 45 329 145 L329 200 L305 200 L305 148 Q256 94 207 148 L207 200 Z",
  ];
  const sampleBuffers = await Promise.all(
    names.map((_, i) =>
      sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><path fill="${["#27252c", "#829cae", "#76523d", "#b2a390", "#a9b394", "#e4c3c2", "#678385", "#53475d"][i]}" fill-rule="evenodd" d="${paths[i % 4]}"/><path fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3" d="M180 220 L178 420 M288 280 L320 420"/></svg>`,
        ),
      )
        .png()
        .toBuffer(),
    ),
  );
  const sheets = (
    await readdir(new URL("../.next/dev/static/chunks/", import.meta.url))
  ).filter((n) => n.endsWith(".css"));
  const server = createServer(async (req, res) => {
    try {
      if (req.url === "/outline.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end(code);
        return;
      }
      if (req.url.startsWith("/asset/")) {
        const name = req.url.slice(7);
        if (!names.includes(name)) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.setHeader("Content-Type", "image/png");
        res.end(sampleBuffers[names.indexOf(name)]);
        return;
      }
      res.setHeader("Content-Type", "text/html;charset=utf-8");
      res.end(
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${sheets.map((n) => `<link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/${n}">`).join("")}</head><body><main style="max-width:440px;margin:auto;padding:16px"><p>本地固定样本 · 非账号数据</p><button id="theme" style="min-height:44px">切换深浅背景</button><h1 style="text-align:center">衣橱拼图 · 8件</h1><div class="sticker-outline-choices">${STICKER_OUTLINE_COLORS.map((c) => `<button class="sticker-outline-choice" data-color="${c.color}" aria-label="${c.label}描边" aria-pressed="${c.value === "white"}"><span style="background:${c.color};color:${c.value === "ink" ? "white" : "black"}">${c.value === "white" ? "✓" : ""}</span></button>`).join("")}</div><div id="board" class="home-look-composition" style="background:#e7def1;border-radius:24px">${names
          .map((n, i) => {
            const p = positions[i];
            return `<div class="home-look-piece" style="left:${p.x}%;top:${p.y}%;width:${p.width}%;height:${p.height}%;transform:translate(-50%,-50%) rotate(${p.rotate}deg)"><span class="garment-sticker size-full" data-sticker-mode="cutout" data-sticker-surface="loose"><span class="garment-sticker-outline" aria-hidden="true" style="visibility:hidden;background:white"></span><img alt="测试衣物${i + 1}" class="garment-sticker-image" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" src="/asset/${n}"></span></div>`;
          })
          .join(
            "",
          )}</div><p id="status" role="status">生成轮廓中</p><button id="export" style="min-height:44px">查看导出轮廓</button><canvas id="result" style="width:100%;display:none"></canvas></main><script type="module">import {loadOutlineMask,createSolidOutline} from '/outline.js'; let color='#ffffff';let dark=false; const pieces=[...document.querySelectorAll('.garment-sticker')];await Promise.all(pieces.map(async p=>{const url=await loadOutlineMask(p.querySelector('img').src);const m=p.querySelector('.garment-sticker-outline');m.style.maskImage='url("'+url+'")';m.style.visibility='visible'}));document.querySelector('#status').textContent='8 / 8 实心描边已就绪';for(const b of document.querySelectorAll('[data-color]')) b.onclick=()=>{color=b.dataset.color;for(const c of document.querySelectorAll('[data-color]')){c.setAttribute('aria-pressed',String(c===b));c.firstElementChild.textContent=c===b?'✓':'';}for(const p of pieces)p.querySelector('.garment-sticker-outline').style.backgroundColor=color};document.querySelector('#theme').onclick=()=>{dark=!dark;document.documentElement.classList.toggle('dark',dark);document.querySelector('#board').style.background=dark?'#322a3d':'#e7def1'};document.querySelector('#export').onclick=async()=>{const bm=await createImageBitmap(await(await fetch(pieces[0].querySelector('img').src)).blob());const c=document.querySelector('#result');c.width=600;c.height=600;c.style.display='block';const ctx=c.getContext('2d');ctx.fillStyle='#322a3d';ctx.fillRect(0,0,600,600);ctx.drawImage(createSolidOutline(bm,color),30,30,540,540);ctx.drawImage(bm,30,30,540,540);bm.close();document.querySelector('#status').textContent='导出轮廓预览已生成'};</script></body></html>`,
      );
    } catch {
      res.writeHead(500);
      res.end("样本加载失败");
    }
  });
  server.listen(3012, "127.0.0.1", () =>
    console.log("本地轮廓样本：http://127.0.0.1:3012"),
  );
}
