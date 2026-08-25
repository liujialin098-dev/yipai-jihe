import {
  ArrowRight,
  Images,
  LogIn,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getViewer } from "@/lib/auth/viewer";
import { getWardrobeCount, getWardrobePreview } from "@/lib/wardrobe/data";

export default async function Home() {
  const [itemCount, previewItems, viewer] = await Promise.all([
    getWardrobeCount(),
    getWardrobePreview(3),
    getViewer(),
  ]);
  const hasItems = itemCount > 0;

  return (
    <div className="page-enter px-5 pt-4">
      <section>
        <p className="text-xs font-semibold text-[var(--system-blue)]">
          你的私人穿搭空间
        </p>
        <h1 className="mt-3 max-w-[21rem] font-heading text-[3.25rem] leading-[0.98] font-bold tracking-[-0.075em] text-[var(--foreground)]">
          今天穿什么，从衣橱开始。
        </h1>
        <p className="mt-4 max-w-[21rem] text-[0.95rem] leading-6 text-[var(--text-secondary)]">
          把衣物放在一个清楚的位置，浏览、筛选和后续推荐都会更自然。
        </p>
      </section>

      <Link
        href="/wardrobe"
        className="surface-card pressable mt-7 block overflow-hidden rounded-[1.75rem] p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--system-blue)]"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)]">
              当前衣橱
            </p>
            <div className="mt-2 flex items-end gap-2">
              <strong className="font-heading text-[4.8rem] leading-[0.82] font-bold tracking-[-0.09em] text-[var(--foreground)]">
                {String(itemCount).padStart(2, "0")}
              </strong>
              <span className="pb-1 text-xs text-[var(--text-secondary)]">
                件衣物
              </span>
            </div>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-[#1d1d1f] text-white shadow-[0_10px_24px_rgba(29,29,31,0.2)]">
            <ArrowRight
              className="size-4"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>
        </div>

        {previewItems.length > 0 ? (
          <div className="mt-7 grid grid-cols-3 gap-2.5">
            {previewItems.map((item, index) => (
              <div
                key={item.id}
                className="stagger-item relative aspect-[4/5] overflow-hidden rounded-[1.15rem] bg-[var(--surface-soft)]"
                style={{ "--stagger": index } as React.CSSProperties}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={`${item.name}${item.demo_key ? "的演示棚拍图" : "的原图"}`}
                    fill
                    sizes="120px"
                    unoptimized
                    className="object-cover"
                    priority={index === 0}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 max-w-[17rem] text-sm leading-6 text-[var(--text-secondary)]">
            加载 24 件安全演示衣物，不用拍照也能先体验衣橱。
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-[var(--hairline)] pt-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {hasItems ? "查看全部衣物" : "建立演示衣橱"}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">仅当前身份可见</p>
        </div>
      </Link>

      <section className="surface-card stagger-item mt-5 rounded-[1.65rem] p-5 [--stagger:1]">
        <p className="text-xs font-semibold text-[var(--system-blue)]">
          账号入口
        </p>
        <h2 className="mt-2 font-heading text-[1.55rem] font-bold tracking-[-0.045em] text-[var(--foreground)]">
          把这间衣橱带到下一台设备。
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {viewer && !viewer.isAnonymous
            ? "当前衣橱已经绑定账号，可以前往设置管理登录状态。"
            : "注册会保留当前衣橱；已有账号可直接登录，不发送验证邮件。"}
        </p>
        {viewer && !viewer.isAnonymous ? (
          <Link
            href="/settings"
            className="motion-button mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            查看账号设置
          </Link>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/settings#account"
              className="motion-button flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-3 text-center text-sm font-semibold text-white"
            >
              <UserPlus className="size-4 shrink-0" aria-hidden="true" />
              注册账号
            </Link>
            <Link
              href="/login"
              className="motion-button flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-3 text-center text-sm font-semibold text-[var(--foreground)]"
            >
              <LogIn className="size-4 shrink-0" aria-hidden="true" />
              登录
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-[1.65rem] font-bold tracking-[-0.045em] text-[var(--foreground)]">
          衣橱已经准备好
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ReadyItem
            icon={Images}
            title="原图目录"
            description="每件衣物都有自己的位置"
            wide
          />
          <ReadyItem
            icon={Search}
            title="快速查找"
            description="组合条件立即定位"
          />
          <ReadyItem
            icon={ShieldCheck}
            title="私有维护"
            description="操作只影响自己"
          />
        </div>
      </section>
    </div>
  );
}

function ReadyItem({
  description,
  icon: Icon,
  title,
  wide = false,
}: {
  description: string;
  icon: typeof Images;
  title: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`surface-card stagger-item rounded-[1.5rem] p-4 ${wide ? "col-span-2 flex items-center gap-4" : "min-h-40"}`}
      style={
        {
          "--stagger": wide ? 0 : title === "快速查找" ? 1 : 2,
        } as React.CSSProperties
      }
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
        <Icon className="size-4.5" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <div className={wide ? "" : "mt-8"}>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
