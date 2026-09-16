// Called by the 051 real-component harness; no account/network writes.
import assert from "node:assert/strict";
import { join } from "node:path";
import { skins } from "../lib/ui/skins.ts";

export async function verifySkinNavigation(page, output) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const colors = new Set();
  for (const skin of skins) {
    for (const dark of [false, true]) {
      await page.getByRole("button", { name: skin.name, exact: true }).click();
      assert.equal(
        await page.evaluate(() => document.documentElement.dataset.skin),
        skin.id,
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("ensemble-skin-v1")),
        skin.id,
      );
      const toggle = page.getByRole("button", {
        name: "夜间模式",
        exact: true,
      });
      if (((await toggle.getAttribute("aria-pressed")) === "true") !== dark)
        await toggle.click();
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.waitForTimeout(350);
      const values = await page.evaluate(() => {
        const ctx = document.createElement("canvas").getContext("2d");
        function rgb(color) {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
        }
        function lum(color) {
          return rgb(color)
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
        const header = getComputedStyle(
          document.querySelector(".editorial-header-shell"),
        );
        const nav = document.querySelector("nav");
        const tint = getComputedStyle(nav, "::before").backgroundColor;
        const ink = getComputedStyle(nav.querySelector(".nav-item")).color;
        const add = getComputedStyle(document.querySelector(".dock-add"));
        const contrasts = {
          header: ratio(
            header.backgroundColor,
            getComputedStyle(document.querySelector(".brand-lockup")).color,
          ),
          add: ratio(add.color, add.backgroundColor),
          dock: ratio(tint, ink),
          white: ratio("white", ink),
        };
        for (const name of ["collage-edit-trigger", "detail-cool-button"]) {
          const css = getComputedStyle(document.querySelector(`.${name}`));
          contrasts[name] = ratio(css.color, css.backgroundColor);
        }
        return {
          header: rgb(header.backgroundColor),
          add: rgb(add.backgroundColor),
          tint: rgb(tint),
          contrasts,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.deepEqual(
        values.header,
        skin.colors[1]
          .slice(1)
          .match(/../g)
          .map((x) => parseInt(x, 16)),
      );
      assert.deepEqual(values.add, values.header);
      for (const [name, value] of Object.entries(values.contrasts))
        assert.ok(value >= 4.5, `${skin.id}/${dark}/${name}=${value}`);
      assert.equal(values.overflow, false);
      colors.add(values.tint.join(","));
      console.log(JSON.stringify({ skin: skin.id, dark, ...values }));
      await page.screenshot({
        path: join(output, `052-${skin.id}-${dark}.png`),
      });
      const add = page.locator(".dock-add");
      await add.hover();
      await page.waitForTimeout(300);
      assert.notEqual(
        await add.evaluate((el) => getComputedStyle(el).backgroundColor),
        "rgb(0, 0, 0)",
      );
      // A minor action retains its tone on hover, not the primary purple fill.
      const minor = page.locator(".detail-cool-button");
      const before = await minor.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await minor.hover();
      await page.waitForTimeout(300);
      assert.equal(
        await minor.evaluate((el) => getComputedStyle(el).backgroundColor),
        before,
      );
    }
  }
  assert.equal(
    colors.size,
    6,
    "all six docks must resolve to distinct skin tints",
  );
  console.log(
    "052: actual skin picker/day-night toggle, persistence, navigation and minor-action contrast passed",
  );
}
