"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function SessionBootstrap({ isReady }: { isReady: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicEntry =
    pathname === "/" || pathname === "/login" || pathname.startsWith("/auth/");

  useEffect(() => {
    if (!isReady && !isPublicEntry) router.replace("/");
  }, [isPublicEntry, isReady, router]);

  if (isReady || isPublicEntry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] px-6 text-[var(--system-blue)]">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <p className="ml-3 text-sm font-medium">正在返回账号入口…</p>
    </div>
  );
}
