import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";
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
    <div className="app-backdrop relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-x-hidden border-x border-[var(--hairline)] shadow-[0_0_90px_rgba(48,52,61,0.12)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-[var(--surface-solid)] px-4 py-2 text-[var(--foreground)] shadow-lg focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        跳到主要内容
      </a>
      <StatusHeader viewer={viewer} />
      <SessionBootstrap isReady={Boolean(viewer)} />
      <main id="main-content" className="flex-1 pb-28">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
