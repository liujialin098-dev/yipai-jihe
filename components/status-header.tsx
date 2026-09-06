"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import type { Viewer } from "@/lib/auth/viewer";
import { displayNameInitial } from "@/lib/profile/validation";

const links = [
  { href: "/", label: "首页" },
  { href: "/diary", label: "穿搭日记" },
  { href: "/profile", label: "个人主页" },
];

export function StatusHeader({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  return (
    <header className="editorial-header sticky top-0 z-30 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="relative flex min-h-12 items-center justify-center">
        <Link
          href="/"
          aria-label="衣拍即合首页"
          className="brand-wordmark flex min-h-11 items-center gap-2"
        >
          <BrandMark className="size-8 rounded-xl" sizes="32px" />
          <span>衣拍即合</span>
        </Link>
        <Link
          href="/profile"
          aria-label="打开个人主页"
          className="profile-header-avatar pressable absolute right-0 flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#8c75a3] text-sm font-semibold text-white"
        >
          {viewer?.avatarUrl ? (
            <Image
              src={viewer.avatarUrl}
              alt="个人头像"
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <span>{displayNameInitial(viewer?.displayName ?? "衣")}</span>
          )}
        </Link>
      </div>
      <nav
        aria-label="顶部导航"
        className="editorial-nav mt-2 grid grid-cols-3"
      >
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={
              (href === "/" ? pathname === "/" : pathname.startsWith(href))
                ? "page"
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
