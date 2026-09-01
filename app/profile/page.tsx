import type { Metadata } from "next";
import { ArrowRight, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";
import { OutfitCanvasPreview } from "@/components/outfits/outfit-canvas-preview";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getProfilePageData } from "@/lib/profile/data";

export const metadata: Metadata = { title: "我的主页" };

export default async function ProfilePage() {
  const data = await getProfilePageData();
  if (!data) {
    return (
      <div className="page-enter px-5 pt-8">
        <section className="surface-card rounded-[1.75rem] p-6 text-center">
          <h1 className="app-page-title">个人主页暂时无法打开</h1>
          <p className="app-page-lead mx-auto mt-3">刷新后可以继续。</p>
        </section>
      </div>
    );
  }

  const { viewer, stats, canvases } = data;

  return (
    <div className="page-enter px-5 pt-3">
      <section className="profile-hero overflow-hidden rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold text-[#4c455c]">
              我的衣橱主页
            </p>
            <h1 className="mt-1 font-heading text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-[#202124]">
              穿出自己的样子
            </h1>
          </div>
          <Link
            href="/settings"
            aria-label="打开设置"
            className="motion-button flex size-11 shrink-0 items-center justify-center rounded-full bg-white/78 text-[#202124] shadow-sm backdrop-blur-xl"
          >
            <Settings2 className="size-4.5" aria-hidden="true" />
          </Link>
        </div>
        <ProfileEditor
          avatarUrl={viewer.avatarUrl}
          displayName={viewer.displayName}
          userId={viewer.userId}
        />
        <p className="mt-3 text-[0.7rem] leading-5 text-[#5f586d]">
          {viewer.isAnonymous
            ? `体验身份 ${viewer.shortId}，注册后可跨设备恢复。`
            : `${viewer.emailMasked ?? "邮箱账号"}，资料与衣橱仅自己可见。`}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="衣橱统计">
        <StatCard
          label="衣橱单品"
          value={stats.itemCount}
          suffix="件"
          tone="lime"
        />
        <StatCard
          label="穿搭卡片"
          value={stats.canvasCount}
          suffix="张"
          tone="lilac"
        />
        <StatCard
          label="日记记录"
          value={stats.diaryDays}
          suffix="天"
          tone="coral"
        />
        <StatCard
          label="30 天利用率"
          value={stats.utilizationRate}
          suffix="%"
          tone="sky"
        />
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="app-page-meta">最近创作</p>
            <h2 className="app-section-title mt-1">我的穿搭卡片</h2>
          </div>
          <Link
            href="/recommendations"
            className="motion-button flex h-9 items-center gap-1 rounded-full bg-[var(--fashion-lime)] px-3 text-xs font-semibold text-[#202124]"
          >
            去搭配
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {canvases.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {canvases.map((canvas) => (
              <Link
                key={canvas.id}
                href={`/outfits/${canvas.id}`}
                className="pressable overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-[0_14px_36px_rgba(54,48,75,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6556a8]"
              >
                <OutfitCanvasPreview
                  compact
                  title={canvas.title}
                  theme={canvas.theme}
                  items={canvas.items}
                  wardrobeItems={canvas.wardrobeItems}
                />
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/recommendations"
            className="surface-card pressable mt-4 flex min-h-40 items-center gap-4 rounded-[1.75rem] p-5"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--fashion-lilac)] text-[#352b64]">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span>
              <strong className="app-card-title block">
                创建第一张穿搭卡片
              </strong>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">
                从每日推荐进入画布，自由排布真实衣物。
              </span>
            </span>
          </Link>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  suffix,
  tone,
  value,
}: {
  label: string;
  suffix: string;
  tone: "coral" | "lilac" | "lime" | "sky";
  value: number;
}) {
  return (
    <article className="profile-stat rounded-[1.55rem] p-4" data-tone={tone}>
      <p className="text-[0.68rem] font-semibold text-black/55">{label}</p>
      <p className="mt-5 font-heading text-[2rem] leading-none font-semibold tracking-[-0.04em] text-[#202124]">
        {value}
        <span className="ml-1 text-xs font-semibold tracking-normal text-black/48">
          {suffix}
        </span>
      </p>
    </article>
  );
}
