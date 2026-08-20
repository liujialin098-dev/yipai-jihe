import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-5 mt-6 flex min-h-72 flex-col items-center justify-center rounded-[2rem] border border-black/6 bg-white text-center">
      <LoaderCircle
        className="size-5 animate-spin text-[#725cff]"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-[#5f5965]">正在整理页面…</p>
    </div>
  );
}
