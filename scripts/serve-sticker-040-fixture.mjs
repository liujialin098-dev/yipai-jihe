// Development-only standalone harness. Never imported by the application.
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const { DefinePlugin } = webpack;
const output = await mkdtemp(join(tmpdir(), "ensemble-sdd040-"));
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/sticker-040.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@": process.cwd(),
          "next/image$": resolve("scripts/fixtures/sticker-040-image.tsx"),
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
        new DefinePlugin({
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
const postcss = require("postcss");
const css = await postcss([require("@tailwindcss/postcss")()]).process(
  await readFile("app/globals.css", "utf8"),
  { from: resolve("app/globals.css") },
);
let png = await sharp(
  Buffer.from(
    '<svg width="300" height="360" xmlns="http://www.w3.org/2000/svg"><path fill="#aa88cf" d="M95 50L60 65L20 115L60 145L80 125L70 290L230 290L220 125L240 145L280 115L240 65L205 50Q150 90 95 50"/><rect x="250" y="315" width="35" height="14" rx="4" fill="#e46658"/></svg>',
  ),
)
  .png()
  .toBuffer();
let version = 1;
const server = createServer(async (req, res) => {
  try {
    if (
      req.url?.startsWith("/api/stickers/items/") &&
      req.url.endsWith("/refine")
    ) {
      if (req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "image/png",
          ETag: `"fixture-${version}"`,
          "Cache-Control": "no-store",
        });
        res.end(png);
        return;
      }
      if (req.headers["if-match"] !== `"fixture-${version}"`) {
        res.writeHead(409);
        res.end();
        return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const next = Buffer.concat(chunks);
      const stats = await sharp(next).stats();
      if (stats.channels[3]?.max === 0) {
        res.writeHead(422);
        res.end();
        return;
      }
      png = next;
      version++;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ cutoutUrl: `/image.png?v=${version}` }));
      return;
    }
    if (req.url?.startsWith("/image.png")) {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      });
      res.end(png);
      return;
    }
    if (req.url === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(await readFile(join(output, "bundle.js")));
      return;
    }
    if (req.url === "/style.css") {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(css.css);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><title>040 贴纸交互样本</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  } catch {
    res.writeHead(500);
    res.end("fixture_error");
  }
});
server.listen(3040, "127.0.0.1", () =>
  console.log(
    "Isolated actual-component fixture: http://127.0.0.1:3040 ; no account or provider calls",
  ),
);
