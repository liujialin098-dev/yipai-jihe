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
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-x-hidden bg-[#f7f8fa] shadow-[0_0_80px_rgba(32,32,42,0.10)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        跳到主要内容
      </a>
      <StatusHeader viewer={viewer} />
      <SessionBootstrap isReady={Boolean(viewer)} />
      <div id="main-content" className="flex-1 pb-8">
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}
