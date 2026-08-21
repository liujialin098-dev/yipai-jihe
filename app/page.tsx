import { ArrowUpRight, Images, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getWardrobeCount } from "@/lib/wardrobe/data";

export default async function Home() {
  const itemCount = await getWardrobeCount();
  const hasItems = itemCount > 0;

  return (
    <div className="px-5 pt-5">
      <section className="closet-grid relative overflow-hidden rounded-[2.1rem] bg-[#20202a] px-6 pt-6 pb-7 text-white shadow-[0_22px_70px_rgba(32,32,42,0.22)]">
        <div className="relative z-10 flex items-start justify-between">
          <p className="text-xs font-medium text-white/55">今日衣橱</p>
          <span className="rounded-full border border-white/15 bg-white/7 px-3 py-1 text-[0.68rem] text-white/70">
            私有空间
          </span>
        </div>
        <div className="relative z-10 mt-14">
          <div className="flex items-end gap-2">
            <strong className="font-heading text-[5.6rem] leading-[0.78] font-semibold tracking-[-0.09em]">
              {String(itemCount).padStart(2, "0")}
            </strong>
            <span className="pb-1 text-sm text-white/55">件衣物</span>
          </div>
          <h1 className="mt-7 max-w-[17rem] font-heading text-[2rem] leading-[1.12] font-semibold tracking-[-0.035em]">
            {hasItems
              ? "衣物有了位置，搭配才有依据。"
              : "衣橱空着，先放进一套日常选择。"}
          </h1>
          <p className="mt-3 max-w-[19rem] text-sm leading-6 text-white/62">
            {hasItems
              ? "现在可以浏览、筛选和维护单品，后续推荐会直接使用这套衣橱。"
              : "加载 24 件安全演示衣物，无需拍照也能先体验完整衣橱。"}
          </p>
          <Link
            href="/wardrobe"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff8068] px-4 py-2.5 text-sm font-semibold text-[#351a16] transition-transform active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {hasItems ? "打开衣橱" : "建立演示衣橱"}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="mt-7">
        <p className="text-xs font-medium text-[#817987]">衣橱能力</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-[#20202a]">
          先把每件衣物放对位置
        </h2>
        <div className="mt-4 grid gap-3">
          <ReadyItem
            icon={Images}
            title="原图目录"
            description="合成图片存入你的私有空间"
          />
          <ReadyItem
            icon={Search}
            title="快速查找"
            description="类别、颜色、季节和场合可以组合筛选"
          />
          <ReadyItem
            icon={ShieldCheck}
            title="独立维护"
            description="编辑、归档和删除只影响自己的衣橱"
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
  icon: typeof Images;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.35rem] border border-black/6 bg-white px-4 py-3.5">
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
