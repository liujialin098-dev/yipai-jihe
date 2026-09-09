import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

await access(
  new URL("../public/brand/ensemble-icon-a-folded-e.png", import.meta.url),
);

const [component, layout, loading, session, css] = await Promise.all([
  read("components/brand-motion.tsx"),
  read("app/layout.tsx"),
  read("app/loading.tsx"),
  read("components/session-bootstrap.tsx"),
  read("app/globals.css"),
]);

assert.match(component, /variant\??:\s*"loader"\s*\|\s*"splash"/);
assert.match(component, /ensemble-icon-a-folded-e\.png/);
assert.match(component, /ensemble-shirt-morph\.svg/);
assert.match(component, /ensemble-shirt-morph-loop\.svg/);
assert.match(component, /BrandName/);
assert.match(
  component,
  /role=\{variant === "loader" \? "status" : undefined\}/,
);
assert.match(
  component,
  /aria-live=\{variant === "loader" \? "polite" : undefined\}/,
);
assert.doesNotMatch(component, /brand-motion-(halo|sheen)/);

assert.match(layout, /import \{ LaunchSplash \}/);
assert.match(layout, /<LaunchSplash \/>[\s\S]*<AppShell/);
assert.doesNotMatch(layout, /"use client"/);

assert.match(loading, /BrandMotion/);
assert.match(loading, /variant="loader"/);
assert.match(loading, /正在准备页面/);

assert.match(session, /BrandMotion/);
assert.match(session, /正在返回账号入口/);
assert.doesNotMatch(session, /LoaderCircle/);
assert.doesNotMatch(session, /animate-spin/);

const start = css.indexOf("/* SDD-041: brand motion */");
const end = css.indexOf("/* End SDD-041 */");
assert.ok(start >= 0 && end > start, "缺少 SDD-041 样式边界");
const brandCss = css.slice(start, end);
assert.match(brandCss, /\.brand-splash\s*\{/);
assert.match(brandCss, /pointer-events:\s*none/);
assert.match(brandCss, /animation:\s*brand-splash-exit[\s\S]*1350ms/);
assert.match(brandCss, /\.brand-motion\[data-variant="loader"\][\s\S]*120ms/);
assert.doesNotMatch(brandCss, /brand-motion-(halo|sheen)/);

assert.doesNotMatch(brandCss, /transition:\s*all/);
assert.doesNotMatch(brandCss, /scale\(0(?:[),\s])/);

assert.match(
  brandCss,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.brand-motion-morph[\s\S]*animation:\s*none/,
);
assert.match(
  brandCss,
  /@media \(prefers-reduced-transparency: reduce\)[\s\S]*\.brand-splash/,
);
assert.match(brandCss, /\.dark \.brand-splash/);
assert.match(brandCss, /env\(safe-area-inset-top\)/);

console.log(
  "SDD-041：正式图标、开屏/加载契约、根接入、120ms 防闪、会话复用、深色与减少动态/透明度边界通过。",
);

// Both variants must interpolate geometry on a single clock, without repainting colors.
for (const asset of [
  "ensemble-shirt-morph.svg",
  "ensemble-shirt-morph-loop.svg",
]) {
  const svg = await read(`public/brand/${asset}`);
  assert.doesNotMatch(
    svg,
    /linearGradient|<image|attributeName="(?:fill|opacity)"/,
  );
  const animations = [...svg.matchAll(/<animate\b[^>]+>/g)].map(([tag]) => tag);
  assert.equal(animations.length, 3);
  for (const field of ["dur", "keyTimes", "keySplines"]) {
    assert.equal(
      new Set(
        animations.map(
          (tag) => tag.match(new RegExp(`${field}="([^"]+)"`))?.[1],
        ),
      ).size,
      1,
    );
  }
}
if (process.argv.includes("--preview")) {
  const { createServer } = await import("node:http");
  const chunks = new URL("../.next/dev/static/chunks/", import.meta.url);
  const stylesheets = (await readdir(chunks)).filter((name) =>
    name.endsWith(".css"),
  );
  const icon = await readFile(
    new URL("../public/brand/ensemble-icon-a-folded-e.png", import.meta.url),
  );
  const image = (className) =>
    `<span class="${className}"><img alt="" src="/brand-icon.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"></span>`;
  const motion = (variant, label) =>
    `<div class="brand-motion" data-variant="${variant}" ${variant === "loader" ? 'role="status" aria-live="polite"' : ""}><span class="brand-motion-stage" aria-hidden="true"><span class="brand-motion-mark">${image("brand-motion-mark-base")}<span class="brand-motion-morph"><img alt="" src="/${variant === "splash" ? "ensemble-shirt-morph.svg" : "ensemble-shirt-morph-loop.svg"}" style="position:absolute;inset:0;width:100%;height:100%"></span></span></span>${variant === "splash" ? '<span class="brand-name-lockup brand-motion-name"><span class="brand-name-english">Ensemble</span><span class="brand-name-chinese">衣拍即合</span></span>' : `<span class="brand-motion-label">${label}</span>`}</div>`;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1:3015");
    res.setHeader("Cache-Control", "no-store");
    if (
      ["/ensemble-shirt-morph.svg", "/ensemble-shirt-morph-loop.svg"].includes(
        url.pathname,
      )
    ) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(
        await readFile(
          new URL(`../public/brand${url.pathname}`, import.meta.url),
        ),
      );
      return;
    }
    if (url.pathname === "/brand-font.ttf") {
      res.setHeader("Content-Type", "font/ttf");
      res.end(
        await readFile(
          new URL("../public/fonts/Fredoka-Variable.ttf", import.meta.url),
        ),
      );
      return;
    }
    if (url.pathname === "/brand-icon.png") {
      res.setHeader("Content-Type", "image/png");
      res.end(icon);
      return;
    }
    if (url.pathname.startsWith("/styles/")) {
      const name = url.pathname.slice(8);
      if (!stylesheets.includes(name)) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader("Content-Type", "text/css");
      res.end(await readFile(new URL(name, chunks)));
      return;
    }
    const isLoader = url.pathname === "/loader";
    const isLoop = url.pathname === "/loop";
    const isDark = url.searchParams.get("theme") === "dark";
    const isLive = url.searchParams.get("still") !== "1";
    const latestCss = await read("app/globals.css");
    const motionCss = latestCss.slice(
      latestCss.indexOf("/* SDD-041: brand motion */"),
      latestCss.indexOf("/* End SDD-041 */"),
    );
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.end(
      `<!doctype html><html class="${isDark ? "dark" : "light"}"><head><meta name="viewport" content="width=device-width,initial-scale=1">${stylesheets.map((name) => `<link rel="stylesheet" href="/styles/${name}">`).join("")}<style>${motionCss}\n.preview-loop .brand-splash{animation:none}\n@font-face{font-family:PreviewBrand;src:url(/brand-font.ttf)}.brand-name-english{font-family:PreviewBrand,sans-serif}.brand-name-lockup{display:flex;flex-direction:column}.app-backdrop{background:#f5f1f8}.dark .app-backdrop{background:#211c28}body{background:#f5f1f8}.dark body{background:#211c28}.preview-controls{position:fixed;bottom:24px;left:0;right:0;z-index:200;display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.preview-controls a{padding:10px 16px;border-radius:14px;background:#e9e0f0;color:#51415f;text-decoration:none;font:14px system-ui}.brand-motion-preview .brand-splash,.brand-motion-preview .brand-motion *{animation-play-state:paused!important;animation-delay:-560ms!important}</style></head><body class="${isLoop ? "preview-loop" : isLive ? "" : "brand-motion-preview"}"><main class="app-backdrop" style="min-height:100svh;max-width:480px;margin:auto">${isLoader ? `<div class="brand-page-loader">${motion("loader", "正在准备页面")}</div>` : `<div class="brand-splash">${isLoop ? motion("splash", "").replace("ensemble-shirt-morph.svg", "ensemble-shirt-morph-loop.svg") : motion("splash", "")}</div>`}</main><nav class="preview-controls"><a href="/loop">循环看变形</a><a href="/?live=1${isDark ? "&theme=dark" : ""}">重播开屏</a><a href="/loader?live=1${isDark ? "&theme=dark" : ""}">加载动画</a><a href="${isLoader ? "/loader" : "/"}?live=1${isDark ? "" : "&theme=dark"}">切换明暗</a></nav></body></html>`,
    );
  });
  server.listen(3015, "127.0.0.1", () =>
    console.log(
      "本地品牌动效样本：http://127.0.0.1:3015/ 与 /loader（?theme=dark 切换深色）",
    ),
  );
}
