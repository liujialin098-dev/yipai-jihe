import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const { chromium } = require(
  process.env.SDD050_PLAYWRIGHT_PACKAGE || "playwright",
);
const output = await mkdtemp(join(tmpdir(), "ensemble-recovery-"));
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/recovery.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@/lib/auth/recovery-actions$": resolve(
            "scripts/fixtures/recovery-actions.tsx",
          ),
          "@/lib/auth/password-recovery$": resolve(
            "scripts/fixtures/recovery-actions.tsx",
          ),
          "@/components/brand-motion$": resolve(
            "scripts/fixtures/recovery-actions.tsx",
          ),
          "next/link$": resolve("scripts/fixtures/recovery-actions.tsx"),
          "next/navigation$": resolve("scripts/fixtures/recovery-actions.tsx"),
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
const styles = css.css + (await readFile("app/skins.css", "utf8"));
const server = createServer(async (req, res) => {
  if (req.url === "/bundle.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(await readFile(join(output, "bundle.js")));
  } else if (req.url === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(styles);
  } else {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recovery isolated fixture</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: "chrome" });
  const cases = [
    { width: 375, height: 812, dark: false, font: 16 },
    { width: 375, height: 812, dark: true, font: 16 },
    { width: 844, height: 390, dark: true, font: 20 },
    { width: 320, height: 740, dark: false, font: 24 },
  ];
  const base = `http://127.0.0.1:${server.address().port}`;
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
    await page.clock.install();
    async function visit(path) {
      await page.goto(base + path);
      await page
        .getByRole("heading", { level: 1 })
        .waitFor({ timeout: 10000 })
        .catch((error) => {
          throw new Error(
            `${error.message}\nBrowser: ${JSON.stringify(errors)}`,
          );
        });
      await page.evaluate(({ dark, font }) => {
        document.documentElement.className = dark ? "dark" : "light";
        document.documentElement.style.fontSize = `${font}px`;
      }, sample);
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        actual: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent?.slice(0, 80),
          }))
          .slice(0, 10),
      }));
      assert.ok(
        overflow.actual <= overflow.width,
        `${path}: ${JSON.stringify(overflow)}`,
      );
      assert.equal(
        await page.evaluate(() => document.body.dataset.unexpectedRedirect),
        undefined,
      );
    }
    await visit("/");
    await page.getByLabel("邮箱", { exact: true }).fill("bad");
    await page.getByRole("button", { name: "获取数字验证码" }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page
        .getByRole("alert")
        .evaluate((el) => document.activeElement === el),
      true,
    );
    await page
      .getByLabel("邮箱", { exact: true })
      .fill("fixture@example.invalid");
    await page.getByRole("button", { name: "获取数字验证码" }).click();
    await page.getByRole("status").waitFor();
    assert.equal(
      await page.getByRole("button", { name: /秒后可重发/ }).isDisabled(),
      true,
    );
    assert.equal(
      await page.getByLabel("邮箱", { exact: true }).inputValue(),
      "fixture@example.invalid",
    );
    async function fillReset(confirm) {
      await page.getByLabel("验证码", { exact: true }).fill("123456");
      await page
        .getByLabel("新密码", { exact: true })
        .fill("Fixture-password-789");
      await page.getByLabel("确认新密码", { exact: true }).fill(confirm);
    }
    await fillReset("different-password");
    await page.getByRole("button", { name: "验证并重设密码" }).click();
    await page.getByRole("alert").waitFor();
    await page.getByRole("link", { name: "两次输入的密码不一致。" }).click();
    assert.equal(
      await page
        .getByLabel("确认新密码", { exact: true })
        .evaluate((el) => document.activeElement === el),
      true,
    );
    assert.equal(
      await page.getByLabel("验证码", { exact: true }).inputValue(),
      "",
    );
    await page.screenshot({
      path: join(output, `error-${index}.png`),
      fullPage: true,
    });
    // Resend countdown must continue after a failed reset instead of getting stuck.
    await page.clock.runFor(61_000);
    assert.equal(
      await page.getByRole("button", { name: "获取数字验证码" }).isDisabled(),
      false,
    );
    await fillReset("Fixture-password-789");
    await page.getByRole("button", { name: "验证并重设密码" }).click();
    await page.getByRole("link", { name: "返回登录", exact: true }).waitFor();
    assert.equal(await page.locator("input[type=password]").count(), 0);
    await visit("/support");
    assert.equal(await page.locator('a[href^="mailto:"]').count(), 1);
    await page.screenshot({
      path: join(output, `support-${index}.png`),
      fullPage: true,
    });
    await visit("/privacy");
    await visit("/auth/recover");
    await page.getByRole("heading", { name: "验证码找回暂未开放" }).waitFor();
    assert.equal(await page.locator("form").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${sample.width}x${sample.height} ${sample.dark ? "dark" : "light"} ${sample.font}px: error focus, resend, clear secrets, success, public routes, no overflow/errors`,
    );
    await page.close();
  }
  console.log(`Screenshots: ${output}`);
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
