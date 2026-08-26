import { SearchX } from "lucide-react";
import Link from "next/link";

export default function WardrobeItemNotFound() {
  return (
    <section className="surface-card page-enter mx-5 mt-4 rounded-[1.75rem] p-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <h1 className="app-page-title mt-12">没有找到这件衣物</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        它可能已被删除，或者不属于当前衣橱。
      </p>
      <Link
        href="/wardrobe"
        className="pressable mt-6 inline-flex min-h-11 items-center rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
      >
        返回我的衣橱
      </Link>
    </section>
  );
}
