import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  action,
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="mx-5 mt-6 overflow-hidden rounded-[2rem] border border-black/7 bg-white p-6 shadow-[0_18px_60px_rgba(39,36,55,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[#776c87] uppercase">
          {eyebrow}
        </p>
        <span className="flex size-10 items-center justify-center rounded-full bg-[#eeeafe] text-[#725cff]">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <h1 className="mt-12 max-w-[15rem] font-heading text-[2.2rem] leading-[1.08] font-semibold tracking-[-0.035em] text-[#20202a]">
        {title}
      </h1>
      <p className="mt-4 max-w-[19rem] text-[0.95rem] leading-6 text-[#6f6b78]">
        {description}
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  );
}
