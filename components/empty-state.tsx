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
    <section className="surface-card page-enter mx-5 mt-4 overflow-hidden rounded-[1.75rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="app-page-meta">{eyebrow}</p>
        <span className="flex size-10 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <h1 className="app-page-title mt-14 max-w-[17rem]">{title}</h1>
      <p className="mt-4 max-w-[20rem] text-[0.92rem] leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  );
}
