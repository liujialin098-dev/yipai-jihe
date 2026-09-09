// Isolated actual-component UI harness; no auth, database, or weather calls.
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";
const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const output = await mkdtemp(join(tmpdir(), "ensemble-sdd043-"));
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/skin-collage-043.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@": process.cwd(),
          "next/image$": resolve("scripts/fixtures/sticker-040-image.tsx"),
          "next/link$": resolve("scripts/fixtures/navigation-043.tsx"),
          "next/navigation$": resolve("scripts/fixtures/navigation-043.tsx"),
        },
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: resolve("scripts/fixtures/sticker-040-loader.cjs"),
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
      ],
    },
    (err, stats) =>
      err || stats.hasErrors()
        ? reject(err ?? new Error(stats.toString({ all: false, errors: true })))
        : done(),
  ),
);
const css = await require("postcss")([
  require("@tailwindcss/postcss")(),
]).process(await readFile("app/globals.css", "utf8"), {
  from: resolve("app/globals.css"),
});
const skinCss = await readFile("app/skins.css", "utf8");
const colors = ["#d3c8b6", "#8badd2", "#947866", "#b0a1cf", "#414859"];
const pngs = await Promise.all(
  colors.map((color) =>
    sharp(
      Buffer.from(
        `<svg width="300" height="360" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="M95 50L60 65L20 115L60 145L80 125L70 290L230 290L220 125L240 145L280 115L240 65L205 50Q150 90 95 50"/><path fill="none" stroke="#ffffff55" stroke-width="3" d="M100 65Q150 100 200 65M90 270L210 270"/></svg>`,
      ),
    )
      .png()
      .toBuffer(),
  ),
);
createServer(async (req, res) => {
  try {
    if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(await readFile(join(output, "bundle.js")));
      return;
    }
    if (req.url === "/style.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(
        css.css +
          skinCss +
          "@font-face{font-family:Fredoka;src:url(/fonts/Fredoka-Variable.ttf)}@font-face{font-family:Playful;src:url(/fonts/ZCOOLKuaiLe-Regular.ttf)}:root{--font-brand-rounded:Fredoka;--font-playful:Playful}",
      );
      return;
    }
    if (req.url?.startsWith("/fonts/") && !req.url.includes("..")) {
      res.end(await readFile(join("public", req.url)));
      return;
    }
    if (req.url === "/brand/ensemble-icon-a-folded-e.png") {
      res.setHeader("Content-Type", "image/png");
      res.end(await readFile("public/brand/ensemble-icon-a-folded-e.png"));
      return;
    }
    if (/^\/image-\d+\.png$/.test(req.url ?? "")) {
      res.setHeader("Content-Type", "image/png");
      res.end(pngs[Number(req.url.match(/\d+/)[0]) % 5]);
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>043隔离交互样本</title><link rel="stylesheet" href="/style.css"><script>try{document.documentElement.className=localStorage.getItem("ensemble-theme-v1")||"light";var s=localStorage.getItem("ensemble-skin-v1");document.documentElement.dataset.skin=["original","violet","rose","green","mono","blue"].includes(s)?s:"original"}catch{}</script></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  } catch {
    res.statusCode = 500;
    res.end("fixture failed");
  }
}).listen(3043, "127.0.0.1", () =>
  console.log("SDD043 fixture http://127.0.0.1:3043"),
);
