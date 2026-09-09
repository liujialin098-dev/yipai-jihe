import type { Metadata } from "next";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DiaryComposer } from "@/components/diary/diary-composer";
import { getDiaryComposerData } from "@/lib/diary/data";

export const metadata: Metadata = { title: "记录穿搭" };

export default async function NewDiaryEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const dateValue = (await searchParams).date;
  const data = await getDiaryComposerData(dateValue);
  if (!data) redirect("/");

  return (
    <div className="page-enter px-5 pt-4">
      <header>
        <Link
          href="/diary"
          className="pressable inline-flex size-10 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-[var(--foreground)]"
          aria-label="返回穿搭日记"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <p className="app-page-meta mt-6 text-center">
          {data.entry ? "编辑已有记录" : "记录实际穿着"}
        </p>
        <h1 className="app-page-title mt-2">这天穿了什么</h1>
      </header>

      {data.error ? (
        <p className="mt-5 rounded-[1.1rem] bg-[#ff453a]/8 px-4 py-3 text-sm leading-6 text-[#b42318]">
          {data.error}
        </p>
      ) : null}

      <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] bg-[var(--system-blue-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
        <Info
          className="mt-0.5 size-4 shrink-0 text-[var(--system-blue)]"
          aria-hidden="true"
        />
        同一天再次保存会更新当天记录，不会重复累计穿着次数。
      </div>

      <DiaryComposer
        items={data.items.map(
          ({ category, cutoutUrl, id, imageUrl, name }) => ({
            category,
            cutoutUrl,
            id,
            imageUrl,
            name,
          }),
        )}
        today={data.today}
        initialEntry={{
          itemIds: data.entry?.item_ids ?? [],
          note: data.entry?.note ?? "",
          occasion: data.entry?.occasion ?? "casual",
          title: data.entry?.title ?? "今日穿搭",
          wornOn: data.wornOn,
        }}
      />
    </div>
  );
}
