"use client";

import { BookHeart, Heart, Home, Layers3, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/", icon: Home, key: "home", label: "首页", primary: false },
  {
    href: "/diary?view=diary",
    icon: BookHeart,
    key: "diary",
    label: "日记",
    primary: false,
  },
  {
    href: "/stickers",
    icon: Layers3,
    key: "stickers",
    label: "贴纸",
    primary: true,
  },
  {
    href: "/diary?view=favorites",
    icon: Heart,
    key: "favorites",
    label: "收藏",
    primary: false,
  },
  {
    href: "/recommendations",
    icon: Sparkles,
    key: "recommendations",
    label: "推荐",
    primary: false,
  },
] as const;

function isCurrent(pathname: string, view: string | null, key: string) {
  if (key === "home") return pathname === "/";
  if (key === "diary") return pathname === "/diary" && view !== "favorites";
  if (key === "favorites") {
    return (
      pathname === "/favorites" ||
      (pathname === "/diary" && view === "favorites")
    );
  }
  return pathname.startsWith(`/${key}`);
}

export function BottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  return (
    <nav
      aria-label="主导航"
      className="bottom-navigation-shell fixed bottom-3 left-1/2 z-30 grid min-h-16 w-[calc(100%-1.5rem)] max-w-[28.5rem] -translate-x-1/2 grid-cols-5 rounded-[1.65rem] px-1.5 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      {items.map(({ href, icon: Icon, key, label, primary }) => {
        const current = isCurrent(pathname, searchParams.get("view"), key);

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
                  ? "nav-icon-shell nav-primary-bevel -mt-2 flex h-11 w-14 items-center justify-center rounded-[0.95rem] border-2 border-white/72 bg-[#6f5687] text-white shadow-[0_8px_22px_rgba(80,59,101,0.2)]"
                  : "nav-icon-shell flex h-6 items-center justify-center"
              }
            >
              <Icon
                className={primary ? "size-6" : "size-[1.1rem]"}
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
