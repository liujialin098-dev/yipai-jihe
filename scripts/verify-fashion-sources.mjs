import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";
import { FASHION_SOURCES } from "../lib/inspiration/catalog.ts";
import {
  dedupeFashionContent,
  fromRss,
} from "../lib/inspiration/content-rules.ts";
import * as core from "../lib/inspiration/core.ts";
import { selectFashionFeed } from "../lib/inspiration/ranking.ts";

const require = createRequire(import.meta.url);
const code = ts.transpileModule(
  await readFile(new URL("../lib/inspiration/rss.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const diagnostics = [];
let fetchImpl;
let cachedOptions;
const exports = {};
new Function("require", "exports", "fetch", "console", code)(
  (id) => {
    if (id === "next/cache")
      return {
        unstable_cache: (fn, _key, options) => {
          cachedOptions = options;
          return fn;
        },
      };
    if (id === "@/lib/inspiration/core") return core;
    if (id === "@/lib/inspiration/catalog") return { FASHION_SOURCES };
    return require(id);
  },
  exports,
  (...args) => fetchImpl(...args),
  {
    info: (...args) => diagnostics.push(args),
    warn: (...args) => diagnostics.push(args),
  },
);
assert.equal(cachedOptions.revalidate, 10800);
const now = new Date();
const fixture = `<rss><channel><item><title>Fall Denim Jackets</title><link>https://www.gq.com/story/denim</link><pubDate>${new Date(now.getTime() - 3600000).toUTCString()}</pubDate></item></channel></rss>`;
fetchImpl = async (url, options) => {
  assert.equal(options.redirect, "error");
  assert.equal(options.cache, "no-store");
  return url.includes("gq.com")
    ? new Response(fixture)
    : new Response("Unavailable", { status: 503 });
};
const partial = await exports.fetchTrustedFashionSources();
assert.equal(partial.entries.length, 1);
assert.deepEqual(partial.unavailableSources, ["Vogue", "Hypebeast"]);
assert.ok(
  diagnostics.some(([, detail]) => detail.reason === "Fashion source HTTP 503"),
);
fetchImpl = async () => {
  throw new DOMException("Aborted", "TimeoutError");
};
const failed = await exports.fetchTrustedFashionSources();
assert.equal(failed.entries.length, 0);
assert.equal(failed.unavailableSources.length, FASHION_SOURCES.length);
fetchImpl = async () => new Response("<rss/>");
assert.equal(
  (await exports.fetchTrustedFashionSources()).unavailableSources.length,
  FASHION_SOURCES.length,
);
fetchImpl = async () =>
  new Response(fixture, { headers: { "content-length": "1000001" } });
assert.equal((await exports.fetchTrustedFashionSources()).entries.length, 0);
assert.equal(
  exports.parseFashionRss(
    fixture.replace("https://www.gq.com/story/denim", "https://evil.example/a"),
    FASHION_SOURCES[1],
  ).length,
  0,
);
const duplicateUrls = exports.parseFashionRss(
  fixture.replace(
    "</channel>",
    `${fixture
      .match(/<item>.*<\/item>/)[0]
      .replace("/story/denim", "/story/denim?utm_source=rss")}</channel>`,
  ),
  FASHION_SOURCES[1],
);
assert.equal(duplicateUrls[0].id, duplicateUrls[1].id);
console.log(
  "Source tests passed: partial/total failures, timeout, malformed/oversized feeds, URL safety, stable IDs and three-hour cache policy.",
);

if (process.argv.includes("--live")) {
  fetchImpl = fetch;
  const snapshot = await exports.fetchTrustedFashionSources();
  const items = dedupeFashionContent(
    snapshot.entries.map((entry) => fromRss(entry, new Date())).filter(Boolean),
  );
  const input = {
    items,
    preferences: {
      topics: ["weather"],
      personalized: true,
      unreadEnabled: true,
    },
    viewer: {
      clothingPreference: "male",
      preferredStyles: ["casual"],
      preferredOccasions: ["casual"],
    },
    wardrobe: [],
    weather: null,
    impressions: items.map((item) => ({
      topic_key: item.topicFingerprint,
      content_id: "fashion-old-article",
      first_seen_at: now.toISOString(),
    })),
  };
  const selected = selectFashionFeed(input);
  console.log(
    JSON.stringify(
      {
        sources: FASHION_SOURCES.map((source) => ({
          name: source.name,
          fetched: snapshot.entries.filter(
            (entry) => entry.sourceName === source.name,
          ).length,
          eligible: items.filter((item) => item.sourceName === source.name)
            .length,
        })),
        unavailable: snapshot.unavailableSources,
        eligibleTotal: items.length,
        selectedWithOldHistoryAndNarrowTopics: selected.length,
        supplemental: selected.filter((item) => item.isDiscovery).length,
      },
      null,
      2,
    ),
  );
  assert.ok(items.length > 0, "Live sources have no eligible content");
  assert.ok(
    selected.length > 0,
    "Narrow topics and prior history emptied live feed",
  );
}
