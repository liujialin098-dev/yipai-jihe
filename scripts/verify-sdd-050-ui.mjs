// 实际React表单＋认证结果假体，不是线上账号验收。
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const { chromium } = require(
  process.env.SDD050_PLAYWRIGHT_PACKAGE || "playwright",
);
const output = await mkdtemp(join(tmpdir(), "ensemble-sdd050-"));
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/auth-050.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@/lib/auth/actions$": resolve(
            "scripts/fixtures/auth-050-actions.ts",
          ),
          "next/navigation$": resolve("scripts/fixtures/auth-050-actions.ts"),
          "@": process.cwd(),
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
    (error, stats) =>
      error || stats.hasErrors()
        ? reject(
            error ?? new Error(stats.toString({ all: false, errors: true })),
          )
        : done(),
  ),
);
const css = await require("postcss")([
  require("@tailwindcss/postcss")(),
]).process(await readFile("app/globals.css", "utf8"), {
  from: resolve("app/globals.css"),
});
const style = css.css + (await readFile("app/skins.css", "utf8"));
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(await readFile(join(output, "bundle.js")));
    } else if (req.url === "/style.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(style);
    } else {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>050隔离表单</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
      );
    }
  } catch {
    res.statusCode = 500;
    res.end("fixture failure");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: "chrome" });
  const cases = [
    { width: 375, height: 812, dark: false, skin: "original", font: 16 },
    { width: 375, height: 812, dark: true, skin: "original", font: 16 },
    { width: 844, height: 390, dark: true, skin: "violet", font: 20 },
    { width: 320, height: 740, dark: false, skin: "rose", font: 24 },
  ];
  for (const [index, sample] of cases.entries()) {
    const page = await browser.newPage({
      viewport: { width: sample.width, height: sample.height },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.route("**/*", (route) =>
      new URL(route.request().url()).hostname === "127.0.0.1"
        ? route.continue()
        : route.abort(),
    );
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(({ dark, skin, font }) => {
      document.documentElement.className = dark ? "dark" : "light";
      document.documentElement.dataset.skin = skin;
      document.documentElement.style.fontSize = `${font}px`;
    }, sample);
    await page.getByText("修改密码", { exact: true }).click();
    const current = page.getByLabel("原密码", { exact: true });
    const password = page.getByLabel("新密码", { exact: true });
    const confirm = page.getByLabel("确认新密码", { exact: true });
    await current.fill("incorrect-fixture");
    await password.fill("new-fixture-123");
    await confirm.fill("new-fixture-123");
    await page.getByRole("button", { name: "保存新密码" }).click();
    await page.waitForSelector("fieldset[disabled]");
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page
        .getByRole("alert")
        .evaluate((el) => document.activeElement === el),
      true,
    );
    assert.equal(await current.getAttribute("aria-invalid"), "true");
    await page.getByRole("link", { name: "请检查原密码后重试。" }).click();
    assert.equal(
      await current.evaluate((el) => document.activeElement === el),
      true,
    );
    await page.screenshot({
      path: join(output, `sample-${index}-error.png`),
      fullPage: true,
    });
    await current.fill("old-fixture-123");
    await password.fill("new-fixture-123");
    await confirm.fill("new-fixture-123");
    await page.getByRole("button", { name: "保存新密码" }).click();
    await page.getByRole("status").waitFor();
    assert.equal(await current.inputValue(), "");
    assert.equal(await password.inputValue(), "");
    assert.equal(await confirm.inputValue(), "");
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      inputHeight: document.querySelector("input").getBoundingClientRect()
        .height,
      buttonHeight: document
        .querySelector('button[type="submit"]')
        .getBoundingClientRect().height,
      summaryHeight: document.querySelector("summary").getBoundingClientRect()
        .height,
    }));
    assert.equal(geometry.overflow, 0);
    assert.ok(
      geometry.inputHeight >= 44 &&
        geometry.buttonHeight >= 44 &&
        geometry.summaryHeight >= 44,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: join(output, `sample-${index}-success.png`),
      fullPage: true,
    });
    console.log(
      `样本${index + 1}: ${sample.width}×${sample.height} ${sample.dark ? "深色" : "浅色"} 字号${sample.font}px，错误焦点/字段跳转/等待禁用/成功清空/无溢出通过。`,
    );
    await page.close();
  }
  console.log(`隔离截图：${output}。不代表真实认证或iPhone验收。`);
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
