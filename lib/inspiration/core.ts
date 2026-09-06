const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
};

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(
      /&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi,
      (match, key: string) => {
        if (key.startsWith("#")) {
          const hex = key.toLowerCase().startsWith("#x");
          const code = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
          return code > 0 &&
            code <= 0x10ffff &&
            !(code >= 0xd800 && code <= 0xdfff)
            ? String.fromCodePoint(code)
            : "�";
        }
        return ENTITY_MAP[key.toLowerCase()] ?? match;
      },
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

export function parseRssItems(xml: string) {
  if (xml.length > 1_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) return [];
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(
    (match) => ({
      link: tag(match[1], "link"),
      pubDate: tag(match[1], "pubDate"),
      title: tag(match[1], "title").slice(0, 180),
    }),
  );
}

export function isTrustedHttpsUrl(value: string, hosts: readonly string[]) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      hosts.includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

export function canonicalFashionUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.replace(/^www\./, "");
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}
