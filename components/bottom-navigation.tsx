"use client";

import { Heart, Home, Plus, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", icon: Home, label: "首页", primary: false },
  { href: "/wardrobe", icon: Shirt, label: "衣橱", primary: false },
  { href: "/wardrobe/new", icon: Plus, label: "添加", primary: true },
  {
    href: "/recommendations",
    icon: Sparkles,
    label: "推荐",
    primary: false,
  },
  { href: "/favorites", icon: Heart, label: "收藏", primary: false },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/wardrobe") return pathname === "/wardrobe";
  return pathname.startsWith(href);
}

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主导航"
      className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-black/7 bg-white/94 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
    >
      {items.map(({ href, icon: Icon, label, primary }) => {
        const current = isCurrent(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`group flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#725cff] ${
              current ? "text-[#725cff]" : "text-[#85808a] hover:text-[#403a47]"
            }`}
          >
            <span
              className={
                primary
                  ? "-mt-7 flex size-12 items-center justify-center rounded-full border-4 border-[#f7f8fa] bg-[#20202a] text-white shadow-[0_8px_22px_rgba(32,32,42,0.25)] transition-transform group-hover:-translate-y-0.5"
                  : "flex h-6 items-center justify-center"
              }
            >
              <Icon
                className={primary ? "size-5" : "size-[1.15rem]"}
                aria-hidden="true"
              />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
