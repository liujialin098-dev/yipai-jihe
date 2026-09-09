import type { AnchorHTMLAttributes } from "react";

// Full page navigation within the isolated harness, never an authenticated router.
export function usePathname() {
  return window.location.pathname;
}
export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}
export default function FixtureLink({
  prefetch: _prefetch,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  return <a {...props} />;
}
