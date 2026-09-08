"use client";

import { House, Newspaper, Plus, Sparkles, Sticker } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/lib/ui/navigation";

const icons = {
  home: House,
  recommendations: Sparkles,
  add: Plus,
  stickers: Sticker,
  inspiration: Newspaper,
};

export function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  return (
    <nav
      aria-label="主导航"
      className="bottom-navigation-shell icon-dock fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 grid min-h-16 w-[calc(100%-1.5rem)] max-w-[28.5rem] -translate-x-1/2 grid-cols-5 rounded-[1.65rem] p-2"
    >
      {primaryNavigation.map(({ href, key, label, primary }) => {
        const current =
          href === "/" ? pathname === href : pathname.startsWith(href);
        const Icon = icons[key];

        return (
          <Link
            key={href}
            href={href}
            aria-label={primary ? "添加衣物" : label}
            title={primary ? "添加衣物" : label}
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
                primary ? "nav-icon-shell dock-add" : "nav-icon-shell dock-icon"
              }
            >
              <Icon
                className={primary ? "size-7" : "size-6"}
                strokeWidth={current ? 2.2 : 1.7}
                aria-hidden="true"
              />
            </span>
            {current && !primary ? (
              <span className="dock-current-dot" aria-hidden="true" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
