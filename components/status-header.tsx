import { Settings2 } from "lucide-react";
import Link from "next/link";
import type { Viewer } from "@/lib/auth/viewer";

export function StatusHeader({ viewer }: { viewer: Viewer | null }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-[#f7f8fa]/92 px-5 py-4 backdrop-blur-xl">
      <Link href="/" className="group flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#725cff] font-heading text-lg font-semibold text-white shadow-[0_8px_20px_rgba(114,92,255,0.26)] transition-transform group-hover:-rotate-3">
          衣
        </span>
        <span>
          <span className="block font-heading text-[1.05rem] leading-none font-semibold tracking-tight text-[#20202a]">
            衣拍即合
          </span>
          <span className="mt-1.5 flex items-center gap-1.5 text-[0.65rem] tracking-[0.12em] text-[#77717e] uppercase">
            <span
              className={`size-1.5 rounded-full ${viewer ? "bg-[#61a978]" : "bg-[#ff8068]"}`}
            />
            {viewer ? "私人衣橱已连接" : "正在准备身份"}
          </span>
        </span>
      </Link>
      <Link
        href="/settings"
        aria-label="打开设置"
        className="flex size-9 items-center justify-center rounded-full border border-black/8 bg-white text-[#504b58] transition-colors hover:bg-[#eeeafe] hover:text-[#725cff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#725cff]"
      >
        <Settings2 className="size-4" aria-hidden="true" />
      </Link>
    </header>
  );
}
