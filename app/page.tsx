import { ArrowUpRight, LockKeyhole, Ruler, Shirt } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="px-5 pt-5">
      <section className="closet-grid relative overflow-hidden rounded-[2.1rem] bg-[#20202a] px-6 pt-6 pb-7 text-white shadow-[0_22px_70px_rgba(32,32,42,0.22)]">
        <div className="relative z-10 flex items-start justify-between">
          <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/55 uppercase">
            今日衣橱
          </p>
          <span className="rounded-full border border-white/15 bg-white/7 px-3 py-1 text-[0.65rem] text-white/70">
            SDD · 001
          </span>
        </div>
        <div className="relative z-10 mt-16">
          <div className="flex items-end gap-2">
            <strong className="font-heading text-[5.6rem] leading-[0.78] font-semibold tracking-[-0.09em]">
              00
            </strong>
            <span className="pb-1 text-sm text-white/55">件衣物</span>
          </div>
          <h1 className="mt-7 max-w-[16rem] font-heading text-[2rem] leading-[1.12] font-semibold tracking-[-0.035em]">
            衣橱空着，方向已经清楚。
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-6 text-white/62">
            私人空间和数据边界已经准备好。下一阶段，从第一件衣物开始建立你的数字衣橱。
          </p>
          <Link
            href="/wardrobe/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff8068] px-4 py-2.5 text-sm font-semibold text-[#351a16] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            查看下一步
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="mt-7">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-[#817987] uppercase">
              已经就绪
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-[#20202a]">
              先打好底，再开始搭配
            </h2>
          </div>
          <span className="font-heading text-3xl text-[#c9c4d2]">03</span>
        </div>
        <div className="mt-4 divide-y divide-black/6 rounded-3xl border border-black/6 bg-white px-5">
          <ReadyItem
            icon={LockKeyhole}
            title="私人身份"
            description="无需注册，刷新后仍属于你"
          />
          <ReadyItem
            icon={Ruler}
            title="数据边界"
            description="资料、偏好和图片路径互相隔离"
          />
          <ReadyItem
            icon={Shirt}
            title="模块骨架"
            description="衣橱、推荐和收藏按阶段接入"
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
}: {
  description: string;
  icon: typeof Shirt;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eeeafe] text-[#725cff]">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-[#292631]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#7a7580]">{description}</p>
      </div>
    </div>
  );
}
