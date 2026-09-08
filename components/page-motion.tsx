"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import {
  primaryNavigation,
  swipeDestination,
  swipePages,
} from "@/lib/ui/navigation";

const interactive =
  "a,button,input,select,textarea,summary,[role='slider'],[role='dialog'],[contenteditable],[data-no-swipe],.sticker-free-canvas";

export function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef(pathname);
  const previousQuery = useRef(query);
  const first = useRef(true);
  const canSwipe = swipePages.some((page) => page === pathname);

  useEffect(() => {
    const node = root.current;
    const before = primaryNavigation.findIndex(
      (item) => item.href === previous.current,
    );
    const after = primaryNavigation.findIndex((item) => item.href === pathname);
    const changed = previous.current !== pathname;
    const queryChanged = previousQuery.current !== query;
    previousQuery.current = query;
    previous.current = pathname;
    if (first.current) {
      first.current = false;
      return;
    }
    if (!node) return;
    if (!changed && !queryChanged) return;
    node.style.transform = "";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const distance =
      reduced || !changed
        ? 0
        : before >= 0 && after >= 0 && after < before
          ? -22
          : 22;
    const animation = node.animate(
      [
        { opacity: 0.65, transform: `translateX(${distance}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: reduced ? 100 : 240, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    // Query-only tab changes keep focus on their own trigger.
    if (changed)
      document.getElementById("main-content")?.focus({ preventScroll: true });
    return () => animation.cancel();
  }, [pathname, query]);

  useEffect(() => {
    const node = root.current;
    if (!node || !canSwipe) return;
    let start: { x: number; y: number; pointerId: number } | null = null;
    let settle: Animation | undefined;
    const reset = () => {
      if (start && node.hasPointerCapture(start.pointerId))
        node.releasePointerCapture(start.pointerId);
      start = null;
      const transform = node.style.transform;
      node.style.transform = "";
      if (
        transform &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        settle?.cancel();
        settle = node.animate([{ transform }, { transform: "translateX(0)" }], {
          duration: 180,
          easing: "ease-out",
        });
      }
    };
    const begin = (event: PointerEvent) => {
      reset();
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        document.querySelector('[role="dialog"],dialog[open]')
      )
        return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest(interactive)) return;
      for (
        let el: Element | null = target;
        el && el !== node;
        el = el.parentElement
      ) {
        if (
          el.scrollWidth > el.clientWidth + 2 &&
          /auto|scroll/.test(getComputedStyle(el).overflowX)
        )
          return;
      }
      const bounds = node.getBoundingClientRect();
      if (event.clientX - bounds.left < 28 || bounds.right - event.clientX < 28)
        return;
      start = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      node.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.pointerId) return;
      if (!event.isPrimary) {
        reset();
        return;
      }
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
        reset();
        return;
      }
      if (
        Math.abs(dx) > 15 &&
        Math.abs(dx) > Math.abs(dy) * 1.8 &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        node.style.transform = `translateX(${Math.max(-28, Math.min(28, dx * 0.12))}px)`;
      }
    };
    const end = (event: PointerEvent) => {
      if (!start || start.pointerId !== event.pointerId) return;
      const destination = swipeDestination(
        pathname,
        event.clientX - start.x,
        event.clientY - start.y,
      );
      reset();
      if (destination) router.push(destination);
    };
    node.addEventListener("pointerdown", begin);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", reset);
    return () => {
      reset();
      node.removeEventListener("pointerdown", begin);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", end);
      node.removeEventListener("pointercancel", reset);
      settle?.cancel();
      node.style.transform = "";
    };
  }, [pathname, canSwipe, router]);

  return (
    <div ref={root} className="route-content" data-swipe={canSwipe}>
      {children}
    </div>
  );
}
