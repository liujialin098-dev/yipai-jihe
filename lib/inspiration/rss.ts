import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { FASHION_SOURCES, type FashionSource } from "@/lib/inspiration/catalog";
import {
  canonicalFashionUrl,
  isTrustedHttpsUrl,
  parseRssItems,
} from "@/lib/inspiration/core";

export type RssFashionEntry = {
  id: string;
  title: string;
  publishedAt: string;
  sourceName: FashionSource["name"];
  sourceUrl: string;
  fetchedAt?: string;
};

export function trustedFashionUrl(value: string, source: FashionSource) {
  return isTrustedHttpsUrl(value, source.hosts);
}

function stableContentId(url: string) {
  return `fashion-${createHash("sha256").update(canonicalFashionUrl(url)).digest("hex").slice(0, 24)}`;
}

export function parseFashionRss(
  xml: string,
  source: FashionSource,
): RssFashionEntry[] {
  return parseRssItems(xml)
    .map((item) => {
      const { title } = item;
      const sourceUrl = item.link;
      const published = new Date(item.pubDate);
      if (
        !title ||
        !trustedFashionUrl(sourceUrl, source) ||
        Number.isNaN(published.getTime())
      )
        return null;
      return {
        id: stableContentId(sourceUrl),
        title,
        publishedAt: published.toISOString(),
        sourceName: source.name,
        sourceUrl,
      };
    })
    .filter((entry): entry is RssFashionEntry => Boolean(entry));
}

const fetchSource = unstable_cache(
  async (source: FashionSource) => {
    const response = await fetch(source.feedUrl, {
      headers: { "User-Agent": "YipaiJihe/1.0 fashion-inspiration" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Fashion source unavailable");
    if (
      Number(response.headers.get("content-length")) > 1_000_000 ||
      !response.body
    )
      throw new Error("Fashion source too large or empty");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let xml = "";
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) {
        await reader.cancel();
        throw new Error("Fashion source exceeds size limit");
      }
      xml += decoder.decode(value, { stream: true });
    }
    xml += decoder.decode();
    const entries = parseFashionRss(xml, source);
    if (!entries.length) throw new Error("Fashion source invalid");
    return entries.map((entry) => ({
      ...entry,
      fetchedAt: new Date().toISOString(),
    }));
  },
  ["fashion-rss-validated-v2"],
  { revalidate: 86_400 },
);

export async function fetchTrustedFashionEntries() {
  return (
    await Promise.all(
      FASHION_SOURCES.map((source) => fetchSource(source).catch(() => [])),
    )
  ).flat();
}
