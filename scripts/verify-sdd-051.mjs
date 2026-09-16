import assert from "node:assert/strict";
import {
  FASHION_TOPICS,
  normalizeFashionTopics,
} from "../lib/inspiration/validation.ts";
import { classify, fromRss } from "../lib/inspiration/content-rules.ts";
import { isPaperColor, nextDockOverlap } from "../lib/ui/dock-surface.ts";

assert.equal(FASHION_TOPICS.length, 8);
assert.deepEqual(normalizeFashionTopics([...FASHION_TOPICS]), [
  ...FASHION_TOPICS,
]);
assert.equal(normalizeFashionTopics([]), null);
assert.equal(normalizeFashionTopics(["bogus"]), null);
assert.deepEqual(normalizeFashionTopics(["street", "street"]), ["street"]);
assert.equal(classify("Street style outfits").topic, "street");
assert.equal(classify("Silver necklaces and earrings").topic, "accessory");
assert.equal(classify("Rainy street style").topic, "weather");
assert.equal(
  fromRss(
    {
      id: "rss-test-accessory",
      title: "Silver necklaces and earrings",
      sourceName: "Vogue",
      sourceUrl: "https://www.vogue.com/article/jewellery",
      publishedAt: "2026-09-13T10:00:00Z",
    },
    new Date("2026-09-14T10:00:00Z"),
  )?.topic,
  "accessory",
);
assert.equal(isPaperColor(255, 255, 255), true);
assert.equal(isPaperColor(241, 230, 255), true);
assert.equal(isPaperColor(181, 138, 240), false);
assert.equal(isPaperColor(48, 32, 68), false);
assert.equal(nextDockOverlap(0.2, false), true);
assert.equal(nextDockOverlap(0.15, true), true);
assert.equal(nextDockOverlap(0.15, false), false);
assert.equal(nextDockOverlap(0, true), false);
console.log("051：8主题白名单/分类、白色表面检测与防抖阈值通过");
