import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const { chromium } = require(process.env.UI_PLAYWRIGHT_PACKAGE || "playwright");
const output = await mkdtemp(join(tmpdir(), "ensemble-controls-"));
await new Promise((done, reject) =>
  webpack(
    {
      mode: "development",
      devtool: false,
      entry: resolve("scripts/fixtures/recommendation-controls-ui.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@/app/recommendations/actions$": resolve(
            "scripts/fixtures/recommendation-controls-services.ts",
          ),
          "./weather-panel$": resolve(
            "scripts/fixtures/recommendation-controls-services.ts",
          ),
          "next/navigation$": resolve(
            "scripts/fixtures/recommendation-controls-navigation.tsx",
          ),
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
  if (req.url === "/bundle.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(await readFile(join(output, "bundle.js")));
  } else if (req.url === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(style);
  } else {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/recommendations`;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
  });
  const errors = [];
  page.setDefaultTimeout(7000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url);
  const casual = page
    .locator("label")
    .filter({ has: page.locator('input[name="occasion"][value="casual"]') });
  await casual.locator("span").first().tap();
  assert.equal(
    await page.locator('input[name="occasion"][value="casual"]').isChecked(),
    true,
    "真实文字触控必须选中休闲，不得被页面手势截获",
  );
  for (const value of ["date", "formal", "casual"]) {
    await page
      .locator("label")
      .filter({ has: page.locator(`input[name="occasion"][value="${value}"]`) })
      .locator("span")
      .first()
      .click();
    assert.equal(
      await page
        .locator(`input[name="occasion"][value="${value}"]`)
        .isChecked(),
      true,
      `鼠标文字点击必须选中${value}`,
    );
  }
  const scene = (value) =>
    page
      .locator(".recommendation-occasion")
      .filter({ has: page.locator(`input[value="${value}"]`) })
      .locator(".recommendation-occasion-face");
  const trigger = page.locator(".recommendation-style-trigger");
  const sheet = page.locator("dialog");
  const style = (value) =>
    sheet
      .locator("label")
      .filter({ has: page.locator(`input[value="${value}"]`) })
      .locator(".recommendation-style-option-face");
  assert.equal(await page.locator('select[name="styleFocus"]').count(), 0);
  await trigger.click();
  await sheet.waitFor({ state: "visible" });
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  await style("streetwear").tap();
  await sheet.waitFor({ state: "hidden" });
  assert.equal(
    await page.locator('input[name="styleFocus"]').inputValue(),
    "streetwear",
  );
  assert.match(await trigger.innerText(), /街头/);
  assert.equal(
    await trigger.evaluate((el) => el === document.activeElement),
    true,
  );
  await scene("formal").click();
  assert.equal(
    await page.locator('input[name="styleFocus"]').inputValue(),
    "auto",
    "不兼容场景应回到自动风格",
  );
  await trigger.click();
  assert.equal(await sheet.getByRole("radio").count(), 5);
  await style("minimal").click();
  await scene("date").tap();
  assert.equal(
    await page.locator('input[name="styleFocus"]').inputValue(),
    "minimal",
    "兼容风格应保留",
  );
  await trigger.click();
  await page.keyboard.press("Escape");
  await sheet.waitFor({ state: "hidden" });
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  await trigger.click();
  await page.mouse.click(5, 5);
  await sheet.waitFor({ state: "hidden" });
  await trigger.click();
  await page.getByRole("button", { name: "关闭风格选择" }).click();
  await sheet.waitFor({ state: "hidden" });
  // Native radio keyboard navigation and visible label both remain functional.
  await page.locator('input[name="occasion"][value="date"]').focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.locator('input[name="occasion"][value="formal"]').isChecked(),
    true,
  );
  await page.locator("#label-regression span").click();
  assert.equal(
    await page.locator('input[name="label-test"]').isChecked(),
    true,
  );
  await page.getByRole("button", { name: "生成今日三套" }).click();
  await page.getByRole("button", { name: "正在整理三套搭配…" }).waitFor();
  assert.equal(await trigger.isDisabled(), true);
  await page.getByText("隔离提交完成").waitFor();
  assert.equal(
    await page.locator('input[name="occasion"][value="formal"]').isChecked(),
    true,
  );
  assert.equal(
    await page.locator('input[name="styleFocus"]').inputValue(),
    "minimal",
  );
  const sent = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("fixture-submission")),
  );
  assert.equal(sent.occasion, "formal");
  assert.equal(sent.styleFocus, "minimal");
  assert.equal(sent.targetDay, "today");
  assert.equal(sent.expectedWeatherLocation, "fixture-city");
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("fixture-navigation")),
    null,
  );
  // Blank-area swipe still works, but a normal press no longer captures a click.
  const swipe = await page.locator("#swipe-test").boundingBox();
  await page.mouse.move(swipe.x + swipe.width - 50, swipe.y + 50);
  await page.mouse.down();
  await page.mouse.move(swipe.x + 50, swipe.y + 50, { steps: 10 });
  await page.mouse.up();
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("fixture-navigation")),
    "/stickers",
  );
  assert.equal(
    await page.locator(".route-content").evaluate((el) => el.style.transform),
    "",
  );
  await page.evaluate(() => sessionStorage.removeItem("fixture-navigation"));
  // Explicitly dismissed guidance stays dismissed after reload, and can be restored.
  const tip = page.getByRole("complementary", { name: "拍摄建议" });
  await tip.waitFor();
  await page.getByRole("button", { name: "关闭拍摄建议，不再提示" }).click();
  assert.equal(await tip.count(), 0);
  await page.reload();
  await page.getByRole("button", { name: "拍摄建议", exact: true }).waitFor();
  assert.equal(await tip.count(), 0);
  await page.getByRole("button", { name: "拍摄建议", exact: true }).click();
  await tip.waitFor();
  await page.reload();
  await tip.waitFor();
  for (const failure of ["fail", "throw"]) {
    await page.goto(`${url}?${failure}`);
    await scene("casual").click();
    await trigger.click();
    await style("streetwear").click();
    await page.getByRole("button", { name: "生成今日三套" }).click();
    await page.locator("output").waitFor();
    assert.equal(
      await page.locator('input[name="occasion"][value="casual"]').isChecked(),
      true,
    );
    assert.equal(
      await page.locator('input[name="styleFocus"]').inputValue(),
      "streetwear",
    );
    assert.equal(await trigger.isDisabled(), false);
  }
  await page.goto(`${url}?weather-error`);
  assert.equal(
    await page.getByRole("button", { name: "生成今日三套" }).isDisabled(),
    true,
  );
  await scene("date").click();
  assert.equal(
    await page.locator('input[name="occasion"][value="date"]').isChecked(),
    true,
  );
  // Day/night and all skins: geometry, arrow centering, text contrast and overflow.
  await page.goto(url);
  for (const skin of ["original", "violet", "rose", "green", "mono", "blue"]) {
    for (const dark of [false, true]) {
      await page.evaluate(
        ({ skin, dark }) => {
          document.documentElement.dataset.skin = skin;
          document.documentElement.classList.toggle("dark", dark);
        },
        { skin, dark },
      );
      await trigger.click();
      await page.waitForTimeout(220);
      const report = await page.evaluate(() => {
        const ctx = document.createElement("canvas").getContext("2d");
        function lum(c) {
          ctx.fillStyle = c;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data]
            .slice(0, 3)
            .map((v) => {
              v /= 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            })
            .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        }
        function ratio(a, b) {
          const x = lum(a),
            y = lum(b);
          return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        }
        const selectors = [
          ".recommendation-style-trigger",
          ".recommendation-occasion input:checked + span",
          ".recommendation-style-option input:checked + span",
          ".upload-photo-hint",
        ];
        const contrasts = selectors.map((s) => {
          const el = document.querySelector(s),
            css = getComputedStyle(el);
          return ratio(css.color, css.backgroundColor);
        });
        const button = document
            .querySelector(".recommendation-style-trigger")
            .getBoundingClientRect(),
          arrow = document
            .querySelector(".recommendation-style-chevron")
            .getBoundingClientRect();
        const dialog = document.querySelector("dialog");
        return {
          contrasts,
          overflow:
            document.documentElement.scrollWidth > innerWidth ||
            dialog.scrollWidth > dialog.clientWidth + 1,
          arrowDelta: Math.abs(
            button.y + button.height / 2 - arrow.y - arrow.height / 2,
          ),
        };
      });
      assert.equal(report.overflow, false);
      assert.ok(report.arrowDelta < 1);
      for (const c of report.contrasts)
        assert.ok(c >= 4.5, `${skin}/${dark}: ${c}`);
      if (skin === "original")
        await page.screenshot({ path: join(output, `sheet-${dark}.png`) });
      await page.keyboard.press("Escape");
      if (skin === "original")
        await page.screenshot({ path: join(output, `controls-${dark}.png`) });
    }
  }
  for (const sample of [
    { width: 320, height: 740, font: 24 },
    { width: 844, height: 390, font: 20 },
    { width: 768, height: 1024, font: 16 },
  ]) {
    await page.setViewportSize(sample);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(
      (font) => (document.documentElement.style.fontSize = `${font}px`),
      sample.font,
    );
    const sizes = await page
      .locator(".recommendation-occasion-face")
      .evaluateAll((elements) =>
        elements.map((el) => {
          const r = el.getBoundingClientRect();
          return [r.width, r.height];
        }),
      );
    sizes.forEach(([w, h]) => {
      assert.ok(w >= 44);
      assert.ok(h >= 44);
    });
    await scene("casual").click();
    await trigger.click();
    await style("y2k").scrollIntoViewIfNeeded();
    assert.equal(
      await sheet.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
    );
    await style("y2k").click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  // Rejected localStorage must never prevent the in-memory close/reopen controls.
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.removeItem = () => {
      throw new Error("blocked");
    };
  });
  await page.reload();
  await tip.waitFor();
  await page.getByRole("button", { name: "关闭拍摄建议，不再提示" }).click();
  await page.getByRole("button", { name: "拍摄建议", exact: true }).click();
  await tip.waitFor();
  assert.deepEqual(errors, []);
  console.log(`Controls browser checks passed; screenshots: ${output}`);
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
