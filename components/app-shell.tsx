import { type ReactNode, Suspense } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { PageMotion } from "@/components/page-motion";
import { SessionBootstrap } from "@/components/session-bootstrap";
import { StatusHeader } from "@/components/status-header";
import type { Viewer } from "@/lib/auth/viewer";

export function AppShell({
  children,
  viewer,
}: {
  children: ReactNode;
  viewer: Viewer | null;
}) {
  return (
    <div className="app-backdrop relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-x-clip border-x border-[var(--hairline)] shadow-[0_0_90px_rgba(48,52,61,0.12)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-[var(--surface-solid)] px-4 py-2 text-[var(--foreground)] shadow-lg focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        跳到主要内容
      </a>
      {viewer && !viewer.needsOnboarding ? (
        <Suspense>
          <StatusHeader viewer={viewer} />
        </Suspense>
      ) : null}
      <SessionBootstrap isReady={Boolean(viewer)} />
      <main
        id="main-content"
        tabIndex={-1}
        className={`motion-stage flex-1 ${viewer && !viewer.needsOnboarding ? "pb-28" : "pb-0"}`}
      >
        <Suspense fallback={children}>
          <PageMotion>{children}</PageMotion>
        </Suspense>
      </main>
      {viewer && !viewer.needsOnboarding ? <BottomNavigation /> : null}
    </div>
  );
}
