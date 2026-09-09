export const SKIN_STORAGE_KEY = "ensemble-skin-v1";
export const skins = [
  {
    id: "original",
    name: "丁香青柠",
    colors: ["#ae8bed", "#d8ff52", "#e8d9fa"],
  },
  { id: "violet", name: "紫橙日落", colors: ["#afa0e7", "#ffb571", "#f4f0fb"] },
  { id: "rose", name: "玫瑰奶油", colors: ["#e8afc8", "#ebd9b7", "#faf3e7"] },
  { id: "green", name: "青绿柠黄", colors: ["#9ebf9d", "#e8ec89", "#f1f5e8"] },
  { id: "mono", name: "黑白映画", colors: ["#b8b8b8", "#e0e0dc", "#f4f4f1"] },
  { id: "blue", name: "海盐橙光", colors: ["#9fbfe7", "#ffbc83", "#eef4fa"] },
] as const;
export type SkinId = (typeof skins)[number]["id"];
export function validSkin(value: unknown): SkinId {
  return skins.find((skin) => skin.id === value)?.id ?? "original";
}
// Only fixed IDs enter the DOM; never interpolate a persisted value as CSS.
export const skinBootstrapScript = `try{var s=localStorage.getItem('${SKIN_STORAGE_KEY}');document.documentElement.dataset.skin=${JSON.stringify(skins.map((s) => s.id))}.includes(s)?s:'original'}catch{document.documentElement.dataset.skin='original'}`;
