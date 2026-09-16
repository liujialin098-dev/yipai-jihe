import { dedupeFashionContent, fromRss } from "@/lib/inspiration/content-rules";
import { fetchTrustedFashionSources } from "@/lib/inspiration/rss";
import { rewriteFashionEntries } from "@/lib/inspiration/summary";
import type { FashionContentItem } from "@/lib/inspiration/validation";

export async function getFashionContentSnapshot(now = new Date()) {
  const sources = await fetchTrustedFashionSources();
  const live = sources.entries
    .map((entry) => fromRss(entry, now))
    .filter((item): item is FashionContentItem => Boolean(item));
  const items = dedupeFashionContent(live);
  return { items, unavailableSources: sources.unavailableSources };
}

export async function getTrustedFashionContent(
  now = new Date(),
  summarize = true,
) {
  const { items } = await getFashionContentSnapshot(now);
  // Internal validation needs all IDs, translation callers retain a bounded batch.
  if (!summarize) return items;
  return rewriteFashionEntries(items.slice(0, 24));
}
