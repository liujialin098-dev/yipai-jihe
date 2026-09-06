import { dedupeFashionContent, fromRss } from "@/lib/inspiration/content-rules";
import { fetchTrustedFashionEntries } from "@/lib/inspiration/rss";
import { rewriteFashionEntries } from "@/lib/inspiration/summary";
import type { FashionContentItem } from "@/lib/inspiration/validation";

export async function getTrustedFashionContent(
  now = new Date(),
  summarize = true,
) {
  const live = (await fetchTrustedFashionEntries())
    .map((entry) => fromRss(entry, now))
    .filter((item): item is FashionContentItem => Boolean(item));
  const items = dedupeFashionContent(live).slice(0, 24);
  return summarize ? rewriteFashionEntries(items) : items;
}
