"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { BrandName } from "@/components/brand-name";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoundedIcon } from "@/components/ui/rounded-icon";
import type { Viewer } from "@/lib/auth/viewer";
import { displayNameInitial } from "@/lib/profile/validation";

export function StatusHeader({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  return (
    <header className="editorial-header pointer-events-none sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
      <div className="editorial-header-shell pointer-events-auto min-h-16 overflow-hidden rounded-[1.65rem] p-2">
        <div className="header-tools relative flex min-h-12 items-center justify-between gap-1">
          <div className="flex shrink-0 items-center">
            <Link
              href="/wardrobe"
              aria-label="打开衣库"
              title="衣库"
              aria-current={
                pathname.startsWith("/wardrobe") && pathname !== "/wardrobe/new"
                  ? "page"
                  : undefined
              }
              className="header-icon"
            >
              <RoundedIcon name="wardrobe" />
            </Link>
            <Link
              href="/diary?view=favorites"
              aria-label="打开收藏"
              title="收藏与日记"
              aria-current={
                pathname === "/diary" &&
                searchParams.get("view") === "favorites"
                  ? "page"
                  : undefined
              }
              className="header-icon"
            >
              <RoundedIcon name="favorites" />
            </Link>
          </div>
          <Link
            href="/"
            aria-label="Ensemble 衣拍即合首页"
            className="brand-lockup header-brand flex min-h-11 min-w-0 items-center justify-center gap-1.5"
          >
            <BrandMark
              className="header-brand-mark size-7 shrink-0 rounded-lg"
              sizes="28px"
            />
            <BrandName />
          </Link>
          <div className="flex shrink-0 items-center">
            <ThemeToggle />
            <Link
              href="/profile"
              aria-label="打开个人主页"
              title="个人主页"
              aria-current={
                pathname.startsWith("/profile") ? "page" : undefined
              }
              className="header-icon header-avatar relative overflow-hidden text-sm font-semibold"
            >
              {viewer?.avatarUrl ? (
                <Image
                  src={viewer.avatarUrl}
                  alt="个人头像"
                  fill
                  sizes="40px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span>{displayNameInitial(viewer?.displayName ?? "衣")}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
