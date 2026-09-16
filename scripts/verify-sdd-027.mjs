import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  classify,
  dedupeFashionContent,
  fingerprint,
  fromRss,
} from "../lib/inspiration/content-rules.ts";
import {
  canonicalFashionUrl,
  isTrustedHttpsUrl,
  parseRssItems,
} from "../lib/inspiration/core.ts";
import {
  rankFashionContent,
  selectFashionFeed,
} from "../lib/inspiration/ranking.ts";
import { normalizeFashionTopics } from "../lib/inspiration/validation.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

await Promise.all(
  [
    "specs/027-fashion-news-feed/spec.md",
    "specs/027-fashion-news-feed/plan.md",
    "specs/027-fashion-news-feed/tasks.md",
    "app/inspiration/page.tsx",
    "components/inspiration/inspiration-card.tsx",
    "lib/inspiration/content.ts",
    "supabase/migrations/20260903090000_fashion_news_feed.sql",
  ].map(read),
);

const vogueHosts = ["www.vogue.com", "vogue.com"];
assert.equal(
  isTrustedHttpsUrl("https://www.vogue.com/article/example", vogueHosts),
  true,
);
assert.equal(
  isTrustedHttpsUrl("http://www.vogue.com/article/example", vogueHosts),
  false,
);
assert.equal(
  isTrustedHttpsUrl("https://evil.example/article/example", vogueHosts),
  false,
);

const fixture = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[The Best Denim Jackets for Fall]]></title><link>https://www.vogue.com/article/denim-jackets</link><pubDate>Wed, 02 Sep 2026 10:00:00 +0000</pubDate></item>
<item><title>Missing date</title><link>https://www.vogue.com/article/missing</link></item>
</channel></rss>`;
const parsed = parseRssItems(fixture);
assert.equal(parsed.length, 2);
assert.equal(parsed[0].title, "The Best Denim Jackets for Fall");
assert.equal(
  new Date(parsed[0].pubDate).toISOString(),
  "2026-09-02T10:00:00.000Z",
);

const [page, card, data, migration] = await Promise.all([
  read("app/inspiration/page.tsx"),
  read("components/inspiration/inspiration-card.tsx"),
  read("lib/inspiration/data.ts"),
  read("supabase/migrations/20260903090000_fashion_news_feed.sql"),
]);
assert.match(page, /Vogue · GQ/);
assert.match(card, /标题速览/);
assert.match(
  await read("components/inspiration/reading-controls.tsx"),
  /新窗口打开/,
);
assert.doesNotMatch(card, /next\/image|<Image/);
assert.match(data, /getWeatherSnapshot/);
assert.match(data, /\.eq\("user_id", viewer\.userId\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
const contentSource = await read("lib/inspiration/content.ts");
assert.match(contentSource, /dedupeFashionContent/);

for (const url of [
  "https://name:password@vogue.com/a",
  "https://vogue.com:8080/a",
  "https://vogue.com.evil.example/a",
])
  assert.equal(isTrustedHttpsUrl(url, vogueHosts), false);
assert.equal(
  canonicalFashionUrl("https://www.vogue.com/article/a/?utm_source=rss#top"),
  canonicalFashionUrl("https://vogue.com/article/a"),
);
assert.doesNotThrow(() =>
  parseRssItems("<rss><item><title>&#99999999;</title></item></rss>"),
);
assert.deepEqual(parseRssItems('<!DOCTYPE rss [<!ENTITY x "bad">]><rss/>'), []);
assert.deepEqual(normalizeFashionTopics(["item", "item"]), ["item"]);
assert.equal(normalizeFashionTopics([]), null);
assert.equal(normalizeFashionTopics(["item", "invalid"]), null);
const now = new Date("2026-09-06T12:00:00Z");
const entry = {
  id: "fashion-fixture-a",
  title: "Denim jackets for fall",
  publishedAt: "2026-09-05T12:00:00Z",
  sourceName: "Vogue",
  sourceUrl: "https://vogue.com/article/a",
};
const base = fromRss(entry, now);
assert.ok(base);
assert.equal(base.summaryKind, "reading-guide");
assert.equal(
  fromRss({ ...entry, publishedAt: "2026-09-07T00:00:00Z" }, now),
  null,
);
assert.equal(
  fromRss({ ...entry, publishedAt: "2026-08-06T12:00:00Z" }, now),
  null,
);
assert.equal(fromRss({ ...entry, title: "Celebrity movie news" }, now), null);
assert.notEqual(classify("Inspired outfit trends").topic, "color");
assert.equal(
  fingerprint("Best denim jackets for fall"),
  fingerprint("Fall denim to wear now"),
);
assert.equal(
  dedupeFashionContent([
    base,
    { ...base, id: "fashion-other", sourceName: "GQ" },
  ]).length,
  1,
);
const impressions = [
  {
    topic_key: base.topicFingerprint,
    content_id: base.id,
    first_seen_at: now.toISOString(),
  },
];
const preferences = {
  topics: ["seasonal", "item", "weather", "trend"],
  personalized: true,
  unreadEnabled: true,
};
const viewer = {
  clothingPreference: "male",
  preferredStyles: ["minimal"],
  preferredOccasions: ["commute"],
};
const fixtures = [
  base,
  { ...base, id: "fashion-women", originalTitle: "Women's dresses" },
  { ...base, id: "fashion-cold", originalTitle: "Heavy winter wool coats" },
  {
    ...base,
    id: "fashion-rain",
    originalTitle: "Waterproof rain jackets",
    topic: "weather",
  },
];
const ranked = rankFashionContent({
  items: fixtures,
  preferences,
  viewer,
  wardrobe: [],
  weather: {
    city: "上海",
    summary: "晴",
    apparentTemperatureC: 32,
    weatherCode: 0,
  },
  now: now.getTime(),
});
assert.deepEqual(
  ranked.map((item) => item.id),
  [base.id],
);
const generic = rankFashionContent({
  items: fixtures,
  preferences: { ...preferences, personalized: false },
  viewer,
  wardrobe: [{ category: "tops", style: "minimal" }],
  weather: null,
  now: now.getTime(),
});
assert.equal(generic.length, 4);
assert.ok(generic.every((item) => item.reason.includes("未使用")));
// Different new articles of an already displayed category stay eligible.
const newArticle = {
  ...base,
  id: "fashion-new-jacket",
  originalTitle: "A New Denim Jacket for Fall",
};
assert.equal(dedupeFashionContent([base, newArticle]).length, 2);
const rankingInput = {
  items: [newArticle],
  preferences,
  viewer,
  wardrobe: [],
  weather: null,
  now: now.getTime(),
};
const unpenalized = rankFashionContent(rankingInput)[0].score;
const recent = rankFashionContent({ ...rankingInput, impressions });
assert.equal(recent.length, 1);
assert.equal(recent[0].score, unpenalized - 10);
assert.equal(
  rankFashionContent({
    ...rankingInput,
    impressions: [{ ...impressions[0], first_seen_at: "2026-09-02T12:00:00Z" }],
  })[0].score,
  unpenalized,
);
const fallback = selectFashionFeed({
  ...rankingInput,
  items: fixtures,
  preferences: { ...preferences, topics: ["color"] },
  impressions,
  weather: {
    city: "上海",
    summary: "晴",
    apparentTemperatureC: 32,
    weatherCode: 0,
  },
});
assert.deepEqual(
  fallback.map((item) => item.id),
  [base.id],
);
assert.equal(fallback[0].isDiscovery, true);
assert.equal(selectFashionFeed({ ...rankingInput, items: [] }).length, 0);
assert.equal(
  selectFashionFeed({
    ...rankingInput,
    items: [
      { ...base, publishedAt: "2026-09-07T00:00:00Z" },
      { ...base, validUntil: "2026-09-01T00:00:00Z" },
    ],
  }).length,
  0,
);
for (const title of [
  "10 New York Fashion Week Outfits to Recreate Now",
  "19 Best Heavyweight T-Shirts",
  "16 Best Loafers for Men",
  "Street Style at Fashion Week",
  "Patta and Crocs Classic Clog Collab",
  "Spring Ready-to-Wear",
  "New Autumn Accessories",
])
  assert.ok(fromRss({ ...entry, title }, now), title);
for (const title of [
  "Celebrity movie news",
  "The Best Menswear Deals",
  "Fashion Week Hair and Makeup",
])
  assert.equal(fromRss({ ...entry, title }, now), null, title);
const scenarioItems = ["minimal", "streetwear"].flatMap((style) =>
  [1, 2, 3, 4].map((n) => ({
    ...base,
    id: `fashion-${style}-${n}`,
    styles: [style],
  })),
);
const orderFor = (style) =>
  rankFashionContent({
    items: scenarioItems,
    preferences,
    viewer: { ...viewer, preferredStyles: [style] },
    wardrobe: [{ category: "tops", style }],
    weather: null,
    now: now.getTime(),
  })
    .slice(0, 5)
    .map((item) => item.id);
assert.ok(
  orderFor("minimal").filter((id) => !orderFor("streetwear").includes(id))
    .length >= 2,
);
console.log(
  "SDD-027 offline fixtures passed: URL safety, dates, article dedupe, three-day soft ranking, safe topic fallback and weather/audience filters.",
);
if (process.argv.includes("--offline")) process.exit(0);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey)
  throw new Error("缺少 Supabase 公开测试配置。请通过 .env.local 运行。");

const clients = [0, 1].map(() =>
  createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  }),
);
const sessions = await Promise.all(
  clients.map((client) => client.auth.signInAnonymously()),
);
for (const session of sessions) assert.ifError(session.error);
const userIds = sessions.map((session) => session.data.user.id);
const ids = ["fashion-test-account-one", "fashion-test-account-two"];

try {
  for (let index = 0; index < clients.length; index += 1) {
    const seededPreference = await clients[index]
      .from("user_preferences")
      .upsert({ user_id: userIds[index] });
    assert.ifError(seededPreference.error);
    const preference = await clients[index]
      .from("user_preferences")
      .update({
        fashion_topics: index === 0 ? ["item"] : ["color"],
        fashion_personalized: index === 0,
      })
      .eq("user_id", userIds[index])
      .select("fashion_topics, fashion_personalized")
      .single();
    assert.ifError(preference.error);
    const inserted = await clients[index]
      .from("fashion_content_reads")
      .insert({ user_id: userIds[index], content_id: ids[index] });
    assert.ifError(inserted.error);
  }

  const own = await clients[0]
    .from("fashion_content_reads")
    .select("content_id")
    .eq("user_id", userIds[0]);
  assert.ifError(own.error);
  assert.deepEqual(
    own.data.map((row) => row.content_id),
    [ids[0]],
  );

  const crossRead = await clients[0]
    .from("fashion_content_reads")
    .select("content_id")
    .eq("user_id", userIds[1]);
  assert.ifError(crossRead.error);
  assert.equal(crossRead.data.length, 0);

  const crossInsert = await clients[0]
    .from("fashion_content_reads")
    .insert({ user_id: userIds[1], content_id: "fashion-cross-account" });
  assert.ok(crossInsert.error);

  for (const client of clients) {
    for (const contentId of [
      "fashion-delivered-first",
      "fashion-delivered-second",
    ]) {
      const result = await client.rpc("record_fashion_impression", {
        p_topic_key: "denim-fall",
        p_content_id: contentId,
      });
      assert.ifError(result.error);
    }
  }
  const ledger = await clients[0]
    .from("fashion_topic_impressions")
    .select("content_id, first_seen_at")
    .eq("user_id", userIds[0])
    .single();
  assert.ifError(ledger.error);
  assert.equal(ledger.data.content_id, "fashion-delivered-first");
  const promptBefore = await clients[0]
    .from("user_preferences")
    .select("fashion_last_prompted_at")
    .eq("user_id", userIds[0])
    .single();
  assert.ifError(promptBefore.error);
  assert.ok(promptBefore.data.fashion_last_prompted_at);
  assert.ifError(
    (
      await clients[0].rpc("record_fashion_impression", {
        p_topic_key: "denim-fall",
        p_content_id: "fashion-delivered-first",
      })
    ).error,
  );
  const promptAfter = await clients[0]
    .from("user_preferences")
    .select("fashion_last_prompted_at")
    .eq("user_id", userIds[0])
    .single();
  assert.ifError(promptAfter.error);
  assert.equal(
    promptAfter.data.fashion_last_prompted_at,
    promptBefore.data.fashion_last_prompted_at,
  );
  for (const table of ["fashion_content_reads", "fashion_topic_impressions"]) {
    const result = await clients[0]
      .from(table)
      .delete()
      .eq("user_id", userIds[1])
      .select("user_id");
    assert.ifError(result.error);
    assert.equal(result.data.length, 0);
    const readOther = await clients[0]
      .from(table)
      .select("user_id")
      .eq("user_id", userIds[1]);
    assert.ifError(readOther.error);
    assert.equal(readOther.data.length, 0);
  }
  const crossUpdate = await clients[0]
    .from("fashion_topic_impressions")
    .update({ content_id: "fashion-cross-update" })
    .eq("user_id", userIds[1])
    .select("user_id");
  assert.ifError(crossUpdate.error);
  assert.equal(crossUpdate.data.length, 0);
  const crossLedgerInsert = await clients[0]
    .from("fashion_topic_impressions")
    .insert({
      user_id: userIds[1],
      topic_key: "forbidden",
      content_id: "fashion-cross-insert",
    });
  assert.ok(crossLedgerInsert.error);
  const forbiddenPreference = await clients[0]
    .from("user_preferences")
    .update({ fashion_personalized: true })
    .eq("user_id", userIds[1])
    .select("user_id");
  assert.ifError(forbiddenPreference.error);
  assert.equal(forbiddenPreference.data.length, 0);
  const duplicate = await clients[0]
    .from("fashion_content_reads")
    .upsert(
      { user_id: userIds[0], content_id: ids[0] },
      { onConflict: "user_id,content_id" },
    );
  assert.ifError(duplicate.error);
  const count = await clients[0]
    .from("fashion_content_reads")
    .select("content_id")
    .eq("user_id", userIds[0]);
  assert.ifError(count.error);
  assert.equal(count.data.length, 1);
} finally {
  for (let index = 0; index < clients.length; index += 1) {
    await clients[index]
      .from("fashion_content_reads")
      .delete()
      .eq("user_id", userIds[index]);
    await clients[index]
      .from("fashion_topic_impressions")
      .delete()
      .eq("user_id", userIds[index]);
    await clients[index]
      .from("user_preferences")
      .update({
        fashion_topics: [
          "trend",
          "color",
          "item",
          "occasion",
          "seasonal",
          "weather",
        ],
        fashion_personalized: true,
        fashion_unread_enabled: true,
        fashion_last_prompted_at: null,
      })
      .eq("user_id", userIds[index]);
    await clients[index].auth.signOut();
  }
}

console.log(
  "SDD-027 verification passed: trusted sources, 30-day dedupe, no copied imagery, preferences and cross-account RLS.",
);
