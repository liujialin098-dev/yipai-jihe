"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { Viewer } from "@/lib/auth/viewer";
import { displayNameInitial } from "@/lib/profile/validation";

export function StatusHeader({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth/");
  return (
    <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between bg-[color-mix(in_srgb,var(--background)_78%,transparent)] px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-2xl">
      <Link href="/" className="group flex items-center gap-3">
        <BrandMark
          className="size-10 rounded-[0.85rem] shadow-[0_8px_22px_rgba(29,29,31,0.1)]"
          sizes="40px"
        />
        <span>
          <span className="block font-heading text-[1.25rem] leading-none font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            衣拍即合
          </span>
          <span className="mt-1.5 flex items-center gap-1.5 text-[0.64rem] font-medium text-[var(--text-tertiary)]">
            <span
              className={`connection-dot size-1.5 rounded-full ${viewer ? "bg-[#30a46c]" : "bg-[#ff9f0a]"}`}
            />
            {isAuthPage
              ? "安全恢复你的衣橱"
              : viewer
                ? "私人衣橱已连接"
                : "正在准备身份"}
          </span>
        </span>
      </Link>
      {isAuthPage ? null : (
        <div className="flex items-center gap-2">
          <Link
            href="/inspiration"
            aria-label="打开时尚灵感"
            className="pressable relative flex size-10 items-center justify-center rounded-full bg-[var(--fashion-lime)] text-[#1d1d1f] shadow-[0_8px_22px_rgba(82,96,33,0.16)]"
          >
            <Sparkles className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </Link>
          <Link
            href="/profile"
            aria-label="打开个人主页"
            className="profile-header-avatar pressable relative flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#202124] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(49,42,73,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6556a8]"
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
      )}
    </header>
  );
}
