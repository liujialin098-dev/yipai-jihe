import type { Metadata } from "next";
import {
  ArrowUpRight,
  BookHeart,
  Heart,
  LockKeyhole,
  Settings2,
  Shirt,
} from "lucide-react";
import Link from "next/link";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getProfilePageData } from "@/lib/profile/data";

export const metadata: Metadata = { title: "我的主页" };

export default async function ProfilePage() {
  const data = await getProfilePageData();
  if (!data)
    return (
      <section className="surface-card mx-5 rounded-3xl p-6">
        <h1 className="app-page-title">个人主页暂时无法打开</h1>
        <p className="app-page-lead mt-2">刷新后可以继续。</p>
      </section>
    );
  const { viewer, stats } = data;
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
            : "仅自己可见"}
        </p>
      </section>
      <section
        className="profile-stats mt-5 grid grid-cols-3 py-4"
        aria-label="衣橱统计"
      >
        <StatLink href="/wardrobe" label="衣橱单品" value={stats.itemCount} />
        <StatLink href="/diary" label="日记记录" value={stats.diaryDays} />
        <StatLink
          href="/diary?view=report&range=30"
          label="30 天利用率"
          value={stats.utilizationRate}
          suffix="%"
        />
      </section>
      <section className="mt-7">
        <h2 className="app-section-title">我的风格日常</h2>
        <div className="mt-4 space-y-2">
          {[
            {
              href: "/wardrobe",
              label: "我的衣橱",
              detail: "喜欢的衣服，常穿常新",
              icon: Shirt,
            },
            {
              href: "/favorites",
              label: "我的收藏",
              detail: "留下心动的单品与搭配",
              icon: Heart,
            },
            {
              href: "/diary",
              label: "穿搭日记",
              detail: "记下每一天的自己",
              icon: BookHeart,
            },
          ].map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="profile-feature-link motion-button flex items-center gap-3 rounded-2xl bg-white/80 p-4"
            >
              <Icon
                className="size-5 shrink-0"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-1 block text-xs opacity-65">{detail}</span>
              </span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </div>
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
      className="profile-stat-link flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl"
    >
      <span className="text-xl leading-7 font-semibold tabular-nums">
        {value}
        <span className="text-xs">{suffix}</span>
      </span>
      <span className="text-[0.65rem] leading-4 opacity-70">{label}</span>
    </Link>
  );
}
