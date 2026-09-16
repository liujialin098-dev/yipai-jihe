// 实际组件隔离测试；导航和保存是假体，不访问线上账号。
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { verifySkinNavigation } from "./verify-sdd-052-ui.mjs";

const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const { chromium } = require(
  process.env.SDD051_PLAYWRIGHT_PACKAGE || "playwright",
);
const output = await mkdtemp(join(tmpdir(), "ensemble-sdd051-"));
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/inspiration-051.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@/app/inspiration/actions$": resolve(
            "scripts/fixtures/inspiration-051-actions.ts",
          ),
          "next/navigation$": resolve("scripts/fixtures/navigation-043.tsx"),
          "next/link$": resolve("scripts/fixtures/navigation-043.tsx"),
          "next/image$": resolve("scripts/fixtures/sticker-040-image.tsx"),
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
const style =
  css.css +
  (await readFile("app/skins.css", "utf8")) +
  (await readFile("app/adaptive-dock.css", "utf8")) +
  "@font-face{font-family:FixturePlayful;src:url(/playful.ttf)}@font-face{font-family:FixtureBrand;src:url(/brand.ttf)}:root{--font-playful:FixturePlayful;--font-brand-rounded:FixtureBrand}";
const server = createServer(async (req, res) => {
  if (req.url === "/bundle.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(await readFile(join(output, "bundle.js")));
  } else if (req.url === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(style);
  } else if (req.url === "/brand/ensemble-icon-a-folded-e.png") {
    res.setHeader("Content-Type", "image/png");
    res.end(await readFile("public/brand/ensemble-icon-a-folded-e.png"));
  } else if (req.url === "/playful.ttf" || req.url === "/brand.ttf") {
    res.setHeader("Content-Type", "font/ttf");
    res.end(
      await readFile(
        resolve(
          "public/fonts",
          req.url === "/playful.ttf"
            ? "ZCOOLKuaiLe-Regular.ttf"
            : "Fredoka-Variable.ttf",
        ),
      ),
    );
  } else {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>051隔离交互</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/inspiration`;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(url);
  await page.getByText("调整灵感偏好", { exact: true }).click();
  const topics = page.locator('input[name="topics"]');
  assert.equal(await topics.count(), 8);
  assert.equal(await page.locator('input[name="topics"]:checked').count(), 8);
  const trend = page.getByRole("checkbox", { name: "趋势观察", exact: true });
  const before = await trend.evaluate(
    (el) => getComputedStyle(el.nextElementSibling).backgroundColor,
  );
  await trend.uncheck();
  assert.equal(await trend.isChecked(), false);
  assert.notEqual(
    await trend.evaluate(
      (el) => getComputedStyle(el.nextElementSibling).backgroundColor,
    ),
    before,
  );
  await trend.check();
  await trend.focus();
  await page.keyboard.press("Space");
  assert.equal(await trend.isChecked(), false);
  await page.getByRole("button", { name: "保存内容偏好" }).click();
  await page.getByText("内容偏好已保存", { exact: true }).waitFor();
  assert.equal(await trend.isChecked(), false);
  await page.reload();
  await page.getByText("调整灵感偏好", { exact: true }).click();
  assert.equal(await trend.isChecked(), false);
  assert.equal(
    await page
      .getByRole("checkbox", { name: "配饰细节", exact: true })
      .isChecked(),
    true,
  );
  // Invalid and server-failed submissions must not reset controlled selections.
  for (const input of await topics.all()) await input.uncheck();
  await page.getByRole("button", { name: "保存内容偏好" }).click();
  await page.getByText("请至少选择一个主题", { exact: true }).waitFor();
  assert.equal(await page.locator('input[name="topics"]:checked').count(), 0);
  await page.goto(`${url}?fail=1`);
  await page.getByText("调整灵感偏好", { exact: true }).click();
  await page.getByRole("checkbox", { name: "配色灵感", exact: true }).uncheck();
  await page.getByRole("button", { name: "保存内容偏好" }).click();
  await page.getByText("偏好尚未保存，请稍后重试。", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "配色灵感", exact: true })
      .isChecked(),
    false,
  );

  const nav = page.getByRole("navigation", { name: "主导航" });
  for (const sample of [
    { width: 375, height: 812, skin: "original", dark: false, font: 16 },
    { width: 320, height: 740, skin: "original", dark: true, font: 20 },
    { width: 844, height: 390, skin: "violet", dark: false, font: 16 },
  ]) {
    await page.setViewportSize({ width: sample.width, height: sample.height });
    await page.evaluate((s) => {
      document.documentElement.dataset.skin = s.skin;
      document.documentElement.classList.toggle("dark", s.dark);
      document.documentElement.style.fontSize = `${s.font}px`;
    }, sample);
    await page.evaluate(() => {
      document.querySelector("details").open = true;
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(300);
    const layout = await page.evaluate(() => {
      const grid = document
        .querySelector(".inspiration-topic-grid")
        .getBoundingClientRect();
      const parent = document.querySelector("fieldset").getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        center: Math.abs(
          grid.left + grid.width / 2 - parent.left - parent.width / 2,
        ),
        min: Math.min(
          ...[...document.querySelectorAll(".inspiration-topic-input")].map(
            (x) => x.getBoundingClientRect().height,
          ),
        ),
      };
    });
    assert.equal(layout.overflow, false);
    assert.ok(layout.center < 1);
    assert.ok(layout.min >= 44);
    // Position the opaque test card underneath the dock (including in dark mode).
    await page.evaluate(() => {
      const card = document.querySelector("#paper-test");
      card.style.backgroundColor = "white";
      const nav = document.querySelector("nav").getBoundingClientRect();
      window.scrollTo({
        top: scrollY + card.getBoundingClientRect().top - nav.top + 20,
        behavior: "instant",
      });
    });
    await page.waitForFunction(
      () => document.querySelector("nav").dataset.overPaper === "true",
    );
    await page.waitForTimeout(350);
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el, "::before").opacity),
      "1",
    );
    const bounds = await nav.boundingBox();
    await page.evaluate(() => {
      const card = document.querySelector("#paper-test");
      window.scrollTo({
        top:
          scrollY + card.getBoundingClientRect().bottom + 150 - innerHeight / 2,
        behavior: "instant",
      });
    });
    await page.waitForFunction(
      () => document.querySelector("nav").dataset.overPaper === "false",
    );
    await page.waitForTimeout(350);
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el, "::before").opacity),
      "0",
    );
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(255, 255, 255)",
    );
    assert.deepEqual(await nav.boundingBox(), bounds);
    assert.equal(
      await page
        .locator(".dock-add")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      sample.skin === "original" ? "rgb(216, 255, 82)" : "rgb(255, 159, 84)",
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(350);
    await page.screenshot({
      path: join(output, `051-${sample.width}-${sample.dark}.png`),
    });
    console.log(
      JSON.stringify({
        sample,
        layout,
        dock: "paper/tint/position/add passed",
      }),
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await nav.evaluate(
      (el) => getComputedStyle(el, "::before").transitionDuration,
    ),
    "0.1s",
  );
  // Every skin/night combination must keep the dock distinct and text readable.
  await page.setViewportSize({ width: 375, height: 812 });
  for (const skin of ["original", "violet", "rose", "green", "mono", "blue"]) {
    for (const dark of [false, true]) {
      await page.evaluate(
        ({ skin, dark }) => {
          document.documentElement.dataset.skin = skin;
          document.documentElement.classList.toggle("dark", dark);
          document.documentElement.style.fontSize = "16px";
          window.scrollTo({ top: 0, behavior: "instant" });
        },
        { skin, dark },
      );
      await page.waitForTimeout(150);
      const contrast = await page.evaluate(() => {
        const ctx = document.createElement("canvas").getContext("2d");
        function rgb(color) {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
        }
        function luminance(color) {
          return rgb(color)
            .map((x) => {
              x /= 255;
              return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            })
            .reduce((n, x, i) => n + x * [0.2126, 0.7152, 0.0722][i], 0);
        }
        function ratio(a, b) {
          const x = luminance(a),
            y = luminance(b);
          return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        }
        const nav = document.querySelector("nav");
        const ink = getComputedStyle(nav.querySelector(".nav-item")).color;
        const chip = document.querySelector(
          'input[name="topics"]:checked',
        ).nextElementSibling;
        const cs = getComputedStyle(chip);
        const heading = document.querySelector(".inspiration-cover");
        const hs = getComputedStyle(heading);
        return {
          dockWhite: ratio(ink, "white"),
          dockTint: ratio(
            ink,
            getComputedStyle(nav, "::before").backgroundColor,
          ),
          chip: ratio(cs.color, cs.backgroundColor),
          title: ratio(hs.color, hs.backgroundColor),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      for (const key of ["dockWhite", "dockTint", "chip", "title"])
        assert.ok(
          contrast[key] >= 4.5,
          `${skin}/${dark}/${key}: ${contrast[key]}`,
        );
      assert.equal(contrast.overflow, false);
    }
  }
  await verifySkinNavigation(page, output);
  assert.deepEqual(errors, []);
  console.log(`051浏览器验证通过；截图目录：${output}`);
} finally {
  await browser.close();
  server.close();
}
