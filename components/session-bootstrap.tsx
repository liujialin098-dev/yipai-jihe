"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandMotion } from "@/components/brand-motion";

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--background)] px-6">
      <BrandMotion variant="loader" label="正在返回账号入口" />
    </div>
  );
}
