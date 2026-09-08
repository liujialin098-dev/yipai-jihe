export type IngestionStickerState = {
  status: "idle" | "queued" | "processing" | "ready" | "failed";
  cutoutUrl: string | null;
};

export type StickerJob = { localId: string; itemId: string };

export async function requestIngestionSticker(itemId: string): Promise<string> {
  const response = await fetch(
    `/api/stickers/items/${encodeURIComponent(itemId)}`,
    {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    },
  );
  const result: unknown = await response.json();
  if (
    !response.ok ||
    !result ||
    typeof result !== "object" ||
    !("status" in result) ||
    !["created", "reused"].includes(String(result.status)) ||
    !("cutoutUrl" in result) ||
    typeof result.cutoutUrl !== "string" ||
    new URL(result.cutoutUrl).protocol !== "https:"
  ) {
    throw new Error("sticker_unavailable");
  }
  return result.cutoutUrl;
}

// 页面内串行队列；入库完成后才加入，不把贴纸失败当成入库失败。
export function createIngestionStickerQueue(
  onChange: (job: StickerJob, state: IngestionStickerState) => void,
  request = requestIngestionSticker,
  gapMs = 4_000,
) {
  const jobs: StickerJob[] = [];
  const pending = new Set<string>();
  const completed = new Set<string>();
  let running = false;
  let disposed = false;
  let nextStartAt = 0;
  let wake: (() => void) | undefined;

  function emit(
    job: StickerJob,
    status: IngestionStickerState["status"],
    cutoutUrl: string | null = null,
  ) {
    if (!disposed) onChange(job, { status, cutoutUrl });
  }

  async function drain() {
    if (running || disposed) return;
    running = true;
    while (jobs.length && !disposed) {
      const waitMs = Math.max(0, nextStartAt - Date.now());
      if (waitMs) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, waitMs);
          wake = () => {
            clearTimeout(timer);
            resolve();
          };
        });
        wake = undefined;
      }
      if (disposed) break;
      const job = jobs.shift();
      if (!job) break;
      emit(job, "processing");
      try {
        const cutoutUrl = await request(job.itemId);
        completed.add(job.itemId);
        emit(job, "ready", cutoutUrl);
      } catch {
        emit(job, "failed");
      } finally {
        pending.delete(job.itemId);
        nextStartAt = Date.now() + gapMs;
      }
    }
    running = false;
  }

  return {
    enqueue(job: StickerJob) {
      if (disposed || pending.has(job.itemId) || completed.has(job.itemId))
        return false;
      pending.add(job.itemId);
      jobs.push(job);
      emit(job, "queued");
      void drain();
      return true;
    },
    dispose() {
      disposed = true;
      jobs.length = 0;
      pending.clear();
      completed.clear();
      wake?.();
    },
  };
}
