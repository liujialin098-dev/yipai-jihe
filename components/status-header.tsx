"use client";

import { Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import type { Viewer } from "@/lib/auth/viewer";

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
        <Link
          href="/settings"
          aria-label="打开设置"
          className="liquid-glass-web pressable flex size-10 items-center justify-center rounded-full text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--system-blue)]"
        >
          <Settings2
            className="size-[1.05rem]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Link>
      )}
    </header>
  );
}
