export const SKIN_STORAGE_KEY = "ensemble-skin-v1";
export const skins = [
  {
    id: "original",
    name: "丁香青柠",
    colors: ["#b58af0", "#deefa8", "#ffffff"],
  },
  { id: "violet", name: "紫橙日落", colors: ["#a783ee", "#ff9f54", "#ffffff"] },
  { id: "rose", name: "玫瑰奶油", colors: ["#f09fc8", "#f4cf86", "#ffffff"] },
  { id: "green", name: "青绿柠黄", colors: ["#8fd18f", "#e2f34b", "#ffffff"] },
  { id: "mono", name: "黑白映画", colors: ["#bfc0c5", "#f0f0eb", "#ffffff"] },
  { id: "blue", name: "海盐橙光", colors: ["#82bff1", "#ff9e5c", "#ffffff"] },
] as const;
export type SkinId = (typeof skins)[number]["id"];
export function validSkin(value: unknown): SkinId {
  return skins.find((skin) => skin.id === value)?.id ?? "original";
}
// Only fixed IDs enter the DOM; never interpolate a persisted value as CSS.
export const skinBootstrapScript = `try{var s=localStorage.getItem('${SKIN_STORAGE_KEY}');document.documentElement.dataset.skin=${JSON.stringify(skins.map((s) => s.id))}.includes(s)?s:'original'}catch{document.documentElement.dataset.skin='original'}`;
