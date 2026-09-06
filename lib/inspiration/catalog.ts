export type FashionSource = {
  name: "Vogue" | "GQ";
  feedUrl: string;
  hosts: readonly string[];
};

export const FASHION_SOURCES: readonly FashionSource[] = [
  {
    name: "Vogue",
    feedUrl: "https://www.vogue.com/feed/rss",
    hosts: ["www.vogue.com", "vogue.com"],
  },
  {
    name: "GQ",
    feedUrl: "https://www.gq.com/feed/rss",
    hosts: ["www.gq.com", "gq.com"],
  },
];

// No editorial news fallback until its source and original publication date
// have been independently verified. Never fabricate dates to fill the feed.
