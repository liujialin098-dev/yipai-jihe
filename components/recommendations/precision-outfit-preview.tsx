import Image from "next/image";

type PrecisionPreviewItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  roleLabel: string;
};

export function PrecisionOutfitPreview({
  title,
  items,
}: {
  title: string;
  items: PrecisionPreviewItem[];
}) {
  return (
    <section
      aria-label={`${title}精准搭配预览`}
      className="relative aspect-[2/3] overflow-hidden rounded-[1.35rem] bg-[#eef1f4] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.98),transparent_35%),linear-gradient(135deg,#eef1f4_0%,#e2e7ec_100%)]" />

      <div className="absolute inset-y-0 left-0 w-[43%] overflow-hidden border-r border-white/70 bg-[#e6eaee]/75">
        <Image
          src="/virtual-models/neutral-studio.png"
          alt="固定无脸人物比例参照"
          fill
          sizes="(max-width: 480px) 38vw, 170px"
          className="object-cover object-top opacity-70 saturate-[0.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-[#dce2e8]/65" />
        <span className="absolute right-2 bottom-3 left-2 rounded-full bg-white/76 px-2 py-1 text-center text-[0.58rem] font-semibold text-[#6b7078] shadow-sm backdrop-blur-md">
          比例参照
        </span>
      </div>

      <div className="absolute inset-y-0 right-0 w-[57%] p-2.5 pt-12 pb-[4.75rem]">
        <div className="grid h-full min-h-0 grid-cols-2 grid-rows-4 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex min-h-0 flex-col overflow-hidden rounded-[0.9rem] border border-white/90 bg-white/86 shadow-[0_8px_22px_rgba(61,70,82,0.08)]"
            >
              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f6f7f8]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={`${item.roleLabel}：${item.name}`}
                    fill
                    sizes="(max-width: 480px) 24vw, 110px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[0.62rem] leading-4 text-[#858a92]">
                    {item.name}
                  </div>
                )}
              </div>
              <div className="truncate px-2 py-1.5 text-[0.58rem] font-medium text-[#4d5158]">
                {item.roleLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
        <span className="rounded-full bg-white/88 px-3 py-1.5 text-[0.68rem] font-semibold text-[#1d1d1f] shadow-[0_6px_20px_rgba(29,29,31,0.08)] backdrop-blur-md">
          精准搭配预览
        </span>
        <span className="rounded-full bg-[#1d1d1f]/[0.07] px-2.5 py-1.5 text-[0.58rem] font-medium text-[#666a73]">
          {items.length} 件原图
        </span>
      </div>

      <p className="absolute right-3 bottom-3 left-[45%] rounded-[0.95rem] border border-white/75 bg-white/78 px-3 py-2 text-[0.62rem] leading-4 text-[#666a73] backdrop-blur-xl">
        衣物按层次排列，不改款、不改色；人物仅用于看整体比例。
      </p>
    </section>
  );
}
