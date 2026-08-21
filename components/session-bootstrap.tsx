"use client";

import { LoaderCircle, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type BootstrapState = { kind: "loading" } | { kind: "error"; message: string };

async function requestSession() {
  const response = await fetch("/api/session/anonymous", {
    cache: "no-store",
    method: "POST",
  });
  const body = (await response.json()) as {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message ?? "暂时无法准备衣橱，请稍后重试。");
  }
}

export function SessionBootstrap({ isReady }: { isReady: boolean }) {
  const router = useRouter();
  const hasStarted = useRef(false);
  const [state, setState] = useState<BootstrapState>({ kind: "loading" });

  const startSession = useCallback(async () => {
    setState({ kind: "loading" });

    try {
      if (navigator.locks) {
        await navigator.locks.request("yipaijihe-session", requestSession);
      } else {
        await requestSession();
      }
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "暂时无法准备衣橱，请稍后重试。",
      });
    }
  }, [router]);

  useEffect(() => {
    if (!isReady && !hasStarted.current) {
      hasStarted.current = true;
      void startSession();
    }
  }, [isReady, startSession]);

  if (isReady) {
    return null;
  }

  if (state.kind === "error") {
    return (
      <section className="mx-5 mt-3 rounded-[1.35rem] border border-[#ff453a]/20 bg-[#ff453a]/8 p-4 text-[var(--foreground)]">
        <p className="text-sm font-medium">{state.message}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 border-[var(--hairline)] bg-[var(--surface-solid)]"
          onClick={startSession}
        >
          <RotateCw aria-hidden="true" />
          重新准备
        </Button>
      </section>
    );
  }

  return (
    <div className="surface-card mx-5 mt-3 flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-[var(--system-blue)]">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <p className="text-sm font-medium">正在为你准备一间私人衣橱…</p>
    </div>
  );
}
