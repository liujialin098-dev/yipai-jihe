export const primaryNavigation = [
  { href: "/", key: "home", label: "首页", primary: false },
  {
    href: "/recommendations",
    key: "recommendations",
    label: "推荐",
    primary: false,
  },
  { href: "/wardrobe/new", key: "add", label: "添加", primary: true },
  { href: "/stickers", key: "stickers", label: "贴纸", primary: false },
  { href: "/inspiration", key: "inspiration", label: "资讯", primary: false },
] as const;

// The add form is excluded; canvas gestures are guarded by PageMotion.
export const swipePages: readonly string[] = [
  "/",
  "/recommendations",
  "/stickers",
  "/inspiration",
];

export function swipeDestination(path: string, dx: number, dy: number) {
  const index = swipePages.indexOf(path);
  if (index < 0 || Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.8)
    return null;
  return swipePages[index + (dx < 0 ? 1 : -1)] ?? null;
}
