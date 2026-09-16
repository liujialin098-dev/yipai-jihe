import Link from "next/link";

export function SupportLinks() {
  return (
    <nav
      aria-label="帮助与隐私"
      className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]"
    >
      <Link
        href="/support"
        className="inline-flex min-h-11 items-center underline underline-offset-4"
      >
        帮助与联系
      </Link>
      <Link
        href="/privacy"
        className="inline-flex min-h-11 items-center underline underline-offset-4"
      >
        数据与隐私说明
      </Link>
    </nav>
  );
}
