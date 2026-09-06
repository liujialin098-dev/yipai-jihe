import type { RecommendationOutfit } from "@/lib/recommendations/constants";
import {
  COLOR_OPTIONS,
  optionLabel,
  type WardrobeColor,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

const STYLE_TITLE_KEYWORDS: Record<WardrobeStyle, readonly string[]> = {
  minimal: ["简约", "极简", "留白", "克制", "纯净"],
  casual: ["休闲", "松弛", "轻松", "自在", "日常"],
  commute: ["通勤", "利落", "干练", "职场", "清醒"],
  elegant: ["优雅", "柔雅", "精致", "轻熟"],
  sporty: ["运动", "活力", "动感"],
  vintage: ["复古", "怀旧", "古着"],
  cleanfit: ["clean fit", "cleanfit", "清爽", "干净"],
  streetwear: ["街头", "潮流", "潮酷"],
  cityboy: ["city boy", "cityboy", "城市男孩"],
  gorpcore: ["gorpcore", "山系", "机能", "户外"],
  preppy: ["学院", "书院", "常春藤"],
  workwear: ["工装", "硬朗", "实用"],
  oldmoney: ["old money", "oldmoney", "老钱", "静奢"],
  y2k: ["y2k", "千禧", "未来感"],
};

const STYLE_TITLE_VARIANTS: Record<
  WardrobeStyle,
  readonly [string, string, string]
> = {
  minimal: ["极简留白", "简约线条", "克制层次"],
  casual: ["松弛日常", "自在层次", "轻松线条"],
  commute: ["利落通勤", "干练线条", "清醒职场"],
  elegant: ["柔雅层次", "优雅线条", "精致留白"],
  sporty: ["轻运动感", "运动节奏", "活力线条"],
  vintage: ["复古色调", "怀旧层次", "古着质感"],
  cleanfit: ["Clean Fit留白", "Clean Fit线条", "清爽Clean Fit"],
  streetwear: ["街头叠搭", "街头轮廓", "潮流街头"],
  cityboy: ["City Boy松弛", "City Boy层次", "城市男孩感"],
  gorpcore: ["Gorpcore机能", "山系机能", "户外机能层次"],
  preppy: ["学院层次", "学院感线条", "书院配色"],
  workwear: ["工装层次", "硬朗工装", "实用工装感"],
  oldmoney: ["老钱质感", "静奢线条", "克制老钱风"],
  y2k: ["Y2K亮点", "千禧层次", "Y2K色彩"],
};

const GENERIC_TITLE =
  /^(?:第[一二三123]套?|方案[一二三123]?|搭配[一二三123]?|今日推荐|明日推荐|推荐穿搭|(?:清醒|从容|轻松)?(?:通勤|休闲|约会|正式)(?:搭配|套装)?)$/i;

function normalizedTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function titleMatchesStyle(title: string, style: WardrobeStyle) {
  const normalized = normalizedTitle(title).toLocaleLowerCase("zh-CN");
  return STYLE_TITLE_KEYWORDS[style].some((keyword) =>
    normalized.includes(keyword.toLocaleLowerCase("zh-CN")),
  );
}

export function hasValidOutfitTitles(
  outfits: ReadonlyArray<
    Pick<RecommendationOutfit, "slot" | "title" | "styleTags">
  >,
) {
  if (outfits.length !== 3) return false;
  const titles = outfits.map((outfit) => normalizedTitle(outfit.title));
  if (
    new Set(titles.map((title) => title.toLocaleLowerCase("zh-CN"))).size !== 3
  )
    return false;
  return outfits.every((outfit, index) => {
    const title = titles[index];
    const style = outfit.styleTags[0];
    return (
      title.length >= 4 &&
      title.length <= 16 &&
      !GENERIC_TITLE.test(title) &&
      Boolean(style) &&
      titleMatchesStyle(title, style)
    );
  });
}

export function buildRuleOutfitTitle({
  items,
  slot,
  style,
  weatherCode,
}: {
  items: ReadonlyArray<{ primary_color: WardrobeColor }>;
  slot: 1 | 2 | 3 | number;
  style: WardrobeStyle;
  weatherCode: number;
}) {
  const color = items[0]?.primary_color ?? "gray";
  const colorLabel = optionLabel(COLOR_OPTIONS, color);
  const variant =
    STYLE_TITLE_VARIANTS[style][Math.max(0, Math.min(2, slot - 1))];
  const rainy =
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99);
  const weatherPrefix = rainy && slot === 1 ? "雨幕" : colorLabel;
  return `${weatherPrefix}${variant}`.slice(0, 16);
}

export const OUTFIT_TITLE_PROMPT_RULES = `title 必须为 4～16 个可读字符，三套互不重复，并与各自 styleTags 的首个风格一致。可结合主色、天气、轮廓或关键单品形成自然名称；禁止“第一套”“方案一”“今日推荐”“休闲搭配”“通勤搭配”等编号式或通用模板名。`;
