export const CATEGORY_OPTIONS = [
  { value: "tops", label: "上装" },
  { value: "bottoms", label: "下装" },
  { value: "dresses", label: "连衣裙" },
  { value: "outerwear", label: "外套" },
  { value: "shoes", label: "鞋" },
  { value: "accessories", label: "配饰" },
] as const;

export const COLOR_OPTIONS = [
  { value: "black", label: "黑色", swatch: "#292a31" },
  { value: "white", label: "白色", swatch: "#f3f3ef" },
  { value: "gray", label: "灰色", swatch: "#92949b" },
  { value: "navy", label: "海军蓝", swatch: "#33405f" },
  { value: "blue", label: "蓝色", swatch: "#7293b8" },
  { value: "green", label: "绿色", swatch: "#647f72" },
  { value: "beige", label: "米色", swatch: "#c7b99f" },
  { value: "brown", label: "棕色", swatch: "#8d6652" },
  { value: "red", label: "红色", swatch: "#c96a60" },
  { value: "pink", label: "粉色", swatch: "#d7a7b3" },
  { value: "purple", label: "紫色", swatch: "#8b7bb4" },
  { value: "yellow", label: "黄色", swatch: "#d5b95f" },
] as const;

export const MATERIAL_OPTIONS = [
  { value: "cotton", label: "棉" },
  { value: "linen", label: "亚麻" },
  { value: "denim", label: "牛仔" },
  { value: "knit", label: "针织" },
  { value: "wool", label: "羊毛" },
  { value: "silk", label: "丝质" },
  { value: "leather", label: "皮革" },
  { value: "synthetic", label: "功能面料" },
] as const;

export const STYLE_OPTIONS = [
  { value: "minimal", label: "简约" },
  { value: "casual", label: "休闲" },
  { value: "commute", label: "通勤" },
  { value: "elegant", label: "优雅" },
  { value: "sporty", label: "运动" },
  { value: "vintage", label: "复古" },
  { value: "cleanfit", label: "Clean Fit" },
  { value: "streetwear", label: "街头" },
  { value: "cityboy", label: "City Boy" },
  { value: "gorpcore", label: "Gorpcore" },
  { value: "preppy", label: "学院" },
  { value: "workwear", label: "工装" },
  { value: "oldmoney", label: "老钱" },
  { value: "y2k", label: "Y2K" },
] as const;

export const SEASON_OPTIONS = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
  { value: "autumn", label: "秋" },
  { value: "winter", label: "冬" },
] as const;

export const OCCASION_OPTIONS = [
  { value: "commute", label: "通勤" },
  { value: "casual", label: "休闲" },
  { value: "date", label: "约会" },
  { value: "formal", label: "正式" },
  { value: "sport", label: "运动" },
] as const;

export const STATUS_OPTIONS = [
  { value: "active", label: "日常衣橱" },
  { value: "archived", label: "已归档" },
] as const;

export type Category = (typeof CATEGORY_OPTIONS)[number]["value"];
export type WardrobeColor = (typeof COLOR_OPTIONS)[number]["value"];
export type Material = (typeof MATERIAL_OPTIONS)[number]["value"];
export type WardrobeStyle = (typeof STYLE_OPTIONS)[number]["value"];
export type Season = (typeof SEASON_OPTIONS)[number]["value"];
export type Occasion = (typeof OCCASION_OPTIONS)[number]["value"];
export type WardrobeStatus = (typeof STATUS_OPTIONS)[number]["value"];

export function isWardrobeStyle(value: string): value is WardrobeStyle {
  return isOptionValue(STYLE_OPTIONS, value);
}

type LabeledOption = { value: string; label: string };

export function isOptionValue<T extends readonly LabeledOption[]>(
  options: T,
  value: string,
): value is T[number]["value"] {
  return options.some((option) => option.value === value);
}

export function optionLabel(options: readonly LabeledOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function colorSwatch(value: string) {
  return (
    COLOR_OPTIONS.find((option) => option.value === value)?.swatch ?? "#92949b"
  );
}
