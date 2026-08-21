import { SearchX } from "lucide-react";
import Link from "next/link";

export default function WardrobeItemNotFound() {
  return (
    <section className="mx-5 mt-6 rounded-[1.8rem] border border-black/6 bg-white p-6">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-[#eeeafe] text-[#725cff]">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-10 font-heading text-[2rem] leading-tight font-semibold tracking-[-0.04em] text-[#20202a]">
        没有找到这件衣物
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#746e79]">
        它可能已被删除，或者不属于当前衣橱。
      </p>
      <Link
        href="/wardrobe"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#20202a] px-5 text-sm font-semibold text-white"
      >
        返回我的衣橱
      </Link>
    </section>
  );
}
