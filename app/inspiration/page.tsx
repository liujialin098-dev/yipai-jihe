import type { Metadata } from "next";
import { CheckCircle2, Sparkles } from "lucide-react";
import { InspirationFeed } from "@/components/inspiration/inspiration-feed";
import { getFashionFeedData } from "@/lib/inspiration/data";
import { getViewer } from "@/lib/auth/viewer";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "时尚灵感" };

export default async function InspirationPage() {
  if (!(await getViewer())) redirect("/");
  const data = await getFashionFeedData();
  return (
    <div className="page-enter px-5 pt-4">
      <header className="overflow-hidden rounded-[1.9rem] bg-[var(--fashion-lilac)] p-5 shadow-[0_22px_55px_rgba(79,61,137,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#2b2441]/65">
              DAILY EDIT · 每日更新
            </p>
            <h1 className="app-page-title mt-3 text-[#1d1d1f]">
              今天值得看的穿搭灵感
            </h1>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--fashion-lime)] text-[#1d1d1f] shadow-[0_10px_26px_rgba(43,36,65,0.16)]">
            <Sparkles className="size-5" strokeWidth={1.7} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 max-w-[22rem] text-sm leading-6 text-[#2b2441]/76">
          只看可信来源，把趋势变成你现有衣橱可以尝试的动作。
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[0.68rem] font-semibold text-[#2b2441]/72">
          <span className="rounded-full bg-white/52 px-3 py-1.5">
            {data.preferences.unreadEnabled
              ? `${data.unreadCount} 条未读`
              : "未读提示已关闭"}
          </span>
          <span className="rounded-full bg-white/52 px-3 py-1.5">
            Vogue · GQ
          </span>
          <span className="rounded-full bg-white/52 px-3 py-1.5">
            {data.weatherUsed ? "已结合真实天气" : "未使用天气加权"}
          </span>
        </div>
      </header>

      <div className="mt-4 flex items-start gap-2.5 px-1 text-xs leading-5 text-[var(--text-secondary)]">
        <CheckCircle2
          className="mt-0.5 size-4 shrink-0 text-[#35805a]"
          aria-hidden="true"
        />
        原始日期和外链来自来源方；中文简述仅依据来源标题整理，阅读提示不是新闻事实，不复制外图或全文。
      </div>

      <InspirationFeed data={data} />
    </div>
  );
}
