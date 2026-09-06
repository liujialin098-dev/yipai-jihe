"use client";

import { useEffect, useRef } from "react";
import { recordFashionImpression } from "@/app/inspiration/actions";

export function ImpressionTracker({ id }: { id: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = marker.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        // No notification permissions or popup; server writes are idempotent.
        void recordFashionImpression(id).catch(() => undefined);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);
  return <span ref={marker} className="block h-px" aria-hidden="true" />;
}
