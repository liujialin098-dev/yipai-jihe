"use client";

import { Heart, Newspaper, Plus, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/wardrobe", icon: Shirt, label: "衣橱", primary: false },
  {
    href: "/recommendations",
    icon: Sparkles,
    label: "推荐",
    primary: false,
  },
  { href: "/wardrobe/new", icon: Plus, label: "添加衣物", primary: true },
  { href: "/inspiration", icon: Newspaper, label: "时尚资讯", primary: false },
  { href: "/favorites", icon: Heart, label: "收藏", primary: false },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/wardrobe") {
    return (
      pathname.startsWith("/wardrobe") && !pathname.startsWith("/wardrobe/new")
    );
  }
  return pathname.startsWith(href);
}

export function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  return (
    <nav
      aria-label="主导航"
      className="liquid-glass-web fixed bottom-3 left-1/2 z-30 grid w-[calc(100%-1.5rem)] max-w-[28.5rem] -translate-x-1/2 grid-cols-5 rounded-[1.65rem] px-1.5 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      {items.map(({ href, icon: Icon, label, primary }) => {
        const current = isCurrent(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            data-current={current ? "true" : "false"}
            data-primary={primary ? "true" : "false"}
            className={`nav-item group relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-[0.61rem] font-medium focus-visible:outline-2 focus-visible:outline-[var(--system-blue)] ${
              current
                ? "text-[var(--foreground)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="nav-bubble" aria-hidden="true" />
            <span
              className={
                primary
                  ? "nav-icon-shell -mt-7 flex size-14 items-center justify-center rounded-[1.25rem] border-[3px] border-[var(--surface-solid)] bg-[#b9a2cf] text-[#3c3146] shadow-[0_8px_24px_rgba(90,69,110,0.17)]"
                  : "nav-icon-shell flex h-6 items-center justify-center"
              }
            >
              <Icon
                className={primary ? "size-7" : "size-[1.1rem]"}
                strokeWidth={current ? 2.2 : 1.7}
                aria-hidden="true"
              />
            </span>
            <span className="relative z-[1]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
