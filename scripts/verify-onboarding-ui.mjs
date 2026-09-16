// Actual React/CSS in Chrome; server actions and routing are isolated mocks.
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const { chromium } = require(
  process.env.SDD053_PLAYWRIGHT_PACKAGE || "playwright",
);
const output = await mkdtemp(join(tmpdir(), "ensemble-053-"));
const mock = resolve("scripts/fixtures/onboarding-053-mocks.tsx");
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/onboarding-053.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@/app/onboarding/actions$": mock,
          "@/app/diary/actions$": mock,
          "@/lib/auth/actions$": mock,
          "next/navigation$": mock,
          "next/link$": mock,
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
const compiled = await require("postcss")([
  require("@tailwindcss/postcss")(),
]).process(await readFile("app/globals.css", "utf8"), {
  from: resolve("app/globals.css"),
});
const styles =
  compiled.css +
  (
    await Promise.all(
      ["skins", "adaptive-dock", "onboarding"].map((name) =>
        readFile(`app/${name}.css`, "utf8"),
      ),
    )
  ).join("\n") +
  "@font-face{font-family:FixturePlayful;src:url(/fonts/ZCOOLKuaiLe-Regular.ttf)}@font-face{font-family:FixtureBrand;src:url(/fonts/Fredoka-Variable.ttf)}:root{--font-playful:FixturePlayful;--font-brand-rounded:FixtureBrand}";
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/bundle.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(await readFile(join(output, "bundle.js")));
  } else if (url.pathname === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(styles);
  } else if (/^\/(brand|fonts)\/[a-zA-Z0-9.-]+$/.test(url.pathname)) {
    res.setHeader(
      "Content-Type",
      url.pathname.endsWith(".svg")
        ? "image/svg+xml"
        : url.pathname.endsWith(".png")
          ? "image/png"
          : "font/ttf",
    );
    res.end(await readFile(join(process.cwd(), "public", url.pathname)));
  } else {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><title>053隔离验收</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const button = (name) => page.getByRole("button", { name, exact: true });
  const step = async (index) =>
    page
      .locator(".onboarding-counter")
      .filter({ hasText: `0${index} / 04` })
      .waitFor();
  await page.goto(`${url}?welcome`);
  await button("创建我的衣橱").waitFor();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: join(output, "welcome.png"), fullPage: true });
  await button("创建我的衣橱").click();
  await page.getByRole("heading", { name: "从你的衣橱开始" }).waitFor();
  await button("返回欢迎页").click();
  await button("已有账号，登录").click();
  await page.getByRole("heading", { name: "欢迎回来" }).waitFor();
  await page.goto(url);
  for (let i = 1; i <= 3; i++) {
    await step(i);
    await button("跳过这一步").click();
  }
  await step(4);
  await button("跳过，进入 APP").click();
  await page.waitForFunction(() => window.onboardingRoute === "/");
  assert.deepEqual(await page.evaluate(() => window.onboardingCalls), [
    { clothing: null, skin: null, occasions: [], styles: [] },
  ]);
  assert.equal(
    await page.evaluate(() =>
      sessionStorage.getItem("ensemble-onboarding-v1:fixture-a"),
    ),
    null,
  );
  await page.goto(url);
  await step(1);
  await page.getByRole("button", { name: "男生 偏好男装" }).click();
  await button("下一步").click();
  await step(2);
  await button("玫瑰奶油").click();
  assert.equal(await page.locator("html").getAttribute("data-skin"), "rose");
  await button("跳过这一步").click();
  await step(3);
  assert.equal(
    await page.locator("html").getAttribute("data-skin"),
    "original",
  );
  for (let i = 0; i < 3; i++)
    await page.locator(".onboarding-choice").nth(i).click();
  await page.locator(".onboarding-choice").nth(3).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await page.locator('[aria-pressed="true"]').count(), 3);
  await button("下一步").click();
  await step(4);
  await page.locator(".onboarding-choice").nth(0).click();
  await page.reload();
  await step(4);
  assert.equal(await page.locator('[aria-pressed="true"]').count(), 1);
  await page.evaluate(() => {
    window.onboardingFail = true;
  });
  await button("进入我的衣橱").click();
  await page.getByRole("alert").filter({ hasText: "保存失败" }).waitFor();
  assert.equal(await page.locator('[aria-pressed="true"]').count(), 1);
  await button("上一步").click();
  await step(3);
  assert.equal(await page.locator('[aria-pressed="true"]').count(), 3);
  await button("上一步").click();
  await step(2);
  await button("海盐橙光").click();
  await button("下一步").click();
  await button("下一步").click();
  await step(4);
  await page.evaluate(() => {
    window.onboardingFail = false;
  });
  await button("进入我的衣橱").click();
  await page.waitForFunction(() => window.onboardingRoute === "/");
  const chosen = await page.evaluate(() => window.onboardingCalls.at(-1));
  assert.equal(chosen.clothing, "male");
  assert.equal(chosen.skin, "blue");
  assert.equal(chosen.occasions.length, 3);
  assert.equal(chosen.styles.length, 1);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("ensemble-skin-v1")),
    "blue",
  );
  await page.goto(`${url}?user=other`);
  await step(1);
  assert.equal(await page.locator('[aria-pressed="true"]').count(), 0);
  // All skins, both modes; actual choice geometry and text contrast.
  const skins = ["original", "violet", "rose", "green", "mono", "blue"];
  for (const skin of skins)
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        ({ skin, theme }) => {
          document.documentElement.dataset.skin = skin;
          document.documentElement.classList.toggle("dark", theme === "dark");
          document.documentElement.classList.toggle("light", theme === "light");
        },
        { skin, theme },
      );
      await page.waitForTimeout(250);
      const result = await page
        .locator(".onboarding-choice")
        .first()
        .evaluate((el) => {
          const css = getComputedStyle(el);
          const ctx = document.createElement("canvas").getContext("2d");
          const luminance = (color) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const values = [...ctx.getImageData(0, 0, 1, 1).data]
              .slice(0, 3)
              .map((value) => {
                const n = value / 255;
                return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
              });
            return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
          };
          const a = luminance(css.color),
            b = luminance(css.backgroundColor);
          return {
            contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            height: el.getBoundingClientRect().height,
            color: css.color,
            background: css.backgroundColor,
          };
        });
      assert.ok(result.height >= 44);
      assert.ok(result.contrast >= 4.5, `${skin}/${theme}: ${result.contrast}`);
      assert.notEqual(result.color, result.background);
    }
  for (const [width, height, theme, large] of [
    [375, 812, "light", false],
    [320, 740, "dark", true],
    [844, 390, "dark", false],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(
      `${url}?user=layout-${width}&theme=${theme}${large ? "&large" : ""}`,
    );
    await step(1);
    for (let i = 1; i <= 4; i++) {
      await step(i);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `overflow ${width} step${i}`,
      );
      if (i === 2 && width === 375) await page.waitForTimeout(350);
      if (i === 2 && width === 375)
        await page.screenshot({
          path: join(output, "themes.png"),
          fullPage: true,
        });
      if (i < 4) await button("跳过这一步").click();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".onboarding-step")
      .evaluate((el) => getComputedStyle(el).animationDuration),
    "0.1s",
  );
  // Block browser persistence: skip must remain usable.
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.removeItem = () => {
      throw new Error("blocked");
    };
  });
  const b = await blocked.newPage();
  await b.goto(url);
  for (let i = 0; i < 3; i++)
    await b.getByRole("button", { name: "跳过这一步", exact: true }).click();
  await b.getByRole("button", { name: "跳过，进入 APP", exact: true }).click();
  await b.waitForFunction(() => window.onboardingRoute === "/");
  await blocked.close();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${url}?diary`);
  assert.equal(await button("保存这天的穿搭").isDisabled(), true);
  const checks = page.getByRole("checkbox");
  await page
    .getByRole("textbox", { name: "标题", exact: true })
    .fill("自己搭配的一天");
  await page.getByText("衣物 1", { exact: true }).click();
  await button("保存这天的穿搭").click();
  await page.getByText("隔离记录已保存", { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => window.diaryIds.length), 1);
  assert.equal(
    await page.getByRole("textbox", { name: "标题", exact: true }).inputValue(),
    "自己搭配的一天",
  );
  for (let i = 1; i < 8; i++)
    await page.getByText(`衣物 ${i + 1}`, { exact: true }).click();
  assert.equal(await checks.nth(8).isDisabled(), true);
  await button("保存这天的穿搭").click();
  await page.waitForFunction(() => window.diaryIds.length === 8);
  await page.getByText("衣物 1", { exact: true }).click();
  assert.equal(await checks.nth(8).isDisabled(), false);
  await page.evaluate(() => {
    window.diaryFail = true;
  });
  await button("保存这天的穿搭").click();
  await page
    .getByText("暂时无法保存，衣物和填写内容已保留，请重试。", { exact: true })
    .waitFor();
  assert.equal(await page.locator('input[name="itemIds"]:checked').count(), 7);
  assert.equal(
    await page.getByRole("textbox", { name: "标题", exact: true }).inputValue(),
    "自己搭配的一天",
  );
  await page.goto(`${url}?diary&empty`);
  await page.getByRole("link", { name: "先去整理衣橱" }).waitFor();
  assert.equal(await button("保存这天的穿搭").isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      output,
      coverage:
        "welcome/login/register; four skips; theme rollback/persist; max3; back/reload; failed save/retry; per-user drafts; six skins day/night; 320/375/844; reduced motion; blocked storage; manual diary 1/8 items and empty state; no browser errors",
      boundary:
        "isolated actions and router, no real authentication or production writes",
    }),
  );
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
