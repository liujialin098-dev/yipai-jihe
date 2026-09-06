import type { Metadata } from "next";
import {
  ArrowUpRight,
  LockKeyhole,
  Plus,
  Settings2,
  Shirt,
} from "lucide-react";
import Link from "next/link";
import { OutfitCanvasPreview } from "@/components/outfits/outfit-canvas-preview";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getProfilePageData } from "@/lib/profile/data";

export const metadata: Metadata = { title: "我的主页" };

export default async function ProfilePage() {
  const data = await getProfilePageData();
  if (!data) {
    return (
      <section className="surface-card mx-5 rounded-3xl p-6">
        <h1 className="app-page-title">个人主页暂时无法打开</h1>
        <p className="app-page-lead mt-2">刷新后可以继续。</p>
      </section>
    );
  }
  const { viewer, stats, canvases } = data;

  return (
    <div className="profile-collection page-enter px-5 pt-3">
      <section aria-label="个人资料">
        <div className="profile-cover flex items-start justify-between px-5 pt-4">
          <p className="text-sm font-medium">我的主页</p>
          <Link
            href="/settings"
            aria-label="打开设置"
            className="profile-round-link"
          >
            <Settings2 className="size-[1.1rem]" aria-hidden="true" />
          </Link>
        </div>
        <ProfileEditor
          avatarUrl={viewer.avatarUrl}
          displayName={viewer.displayName}
          userId={viewer.userId}
        />
        <p className="profile-privacy mt-4 flex items-start gap-1.5 text-xs leading-5">
          <LockKeyhole
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          {viewer.isAnonymous
            ? "仅自己可见。体验身份，注册后可跨设备恢复。"
            : "仅自己可见，衣橱与穿搭由你保管。"}
        </p>
      </section>

      <section
        className="profile-stats mt-5 grid grid-cols-4 py-4"
        aria-label="衣橱统计"
      >
        <StatLink href="/wardrobe" label="衣橱单品" value={stats.itemCount} />
        <StatLink
          href="#my-outfits"
          label="穿搭卡片"
          value={stats.canvasCount}
        />
        <StatLink href="/diary" label="日记记录" value={stats.diaryDays} />
        <StatLink
          href="/diary?view=report&range=30"
          label="30 天利用率"
          value={stats.utilizationRate}
          suffix="%"
        />
      </section>

      <nav className="profile-tabs mt-5 flex" aria-label="个人内容">
        <Link href="/profile" aria-current="page">
          穿搭作品
        </Link>
        <Link href="/wardrobe">我的衣橱</Link>
        <Link href="/favorites">我的收藏</Link>
      </nav>

      <section id="my-outfits" className="scroll-mt-6 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="app-section-title">我的穿搭卡片</h2>
            <p className="profile-privacy mt-1 text-xs">
              最近编辑的作品，最多展示 4 张
            </p>
          </div>
          <Link
            href="/recommendations"
            className="profile-create motion-button shrink-0"
          >
            <Plus className="size-4" aria-hidden="true" />
            去搭配
          </Link>
        </div>
        {canvases.length ? (
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6">
            {canvases.map((canvas) => (
              <Link
                key={canvas.id}
                href={`/outfits/${canvas.id}`}
                className="profile-outfit-link group min-w-0"
              >
                <OutfitCanvasPreview
                  compact
                  hideHeading
                  title={canvas.title}
                  theme={canvas.theme}
                  items={canvas.items}
                  wardrobeItems={canvas.wardrobeItems}
                />
                <div className="mt-3 flex items-start justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 break-words text-sm leading-5 font-medium">
                      {canvas.title}
                    </h3>
                    <p className="profile-privacy mt-1 text-xs">
                      {canvas.items.length} 件单品
                    </p>
                  </div>
                  <ArrowUpRight
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="profile-empty mt-5 rounded-3xl px-6 py-10 text-center">
            <Shirt
              className="mx-auto mb-4 size-8"
              strokeWidth={1.3}
              aria-hidden="true"
            />
            <h3 className="text-base font-medium">这里，留给你的第一套搭配</h3>
            <p className="profile-privacy mx-auto mt-2 max-w-60 text-sm leading-6">
              从每日推荐进入画布，摆好衣服，保存成自己的穿搭卡片。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatLink({
  href,
  label,
  value,
  suffix = "",
}: {
  href: string;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <Link
      href={href}
      className="profile-stat-link flex min-h-12 min-w-0 flex-col items-center justify-center gap-1"
    >
      <span className="text-xl leading-7 font-semibold tabular-nums">
        {value}
        <span className="text-xs">{suffix}</span>
      </span>
      <span className="profile-privacy text-[0.65rem] leading-4">{label}</span>
    </Link>
  );
}
