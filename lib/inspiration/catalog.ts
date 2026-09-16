export type FashionSource = {
  name: "Vogue" | "GQ" | "Hypebeast";
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
  {
    name: "Hypebeast",
    feedUrl: "https://hypebeast.com/feed",
    hosts: ["hypebeast.com", "www.hypebeast.com"],
  },
];

// No editorial news fallback until its source and original publication date
// have been independently verified. Never fabricate dates to fill the feed.
