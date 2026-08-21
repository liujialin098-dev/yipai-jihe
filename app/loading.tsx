export default function Loading() {
  return (
    <div className="page-enter mx-5 mt-4 space-y-4">
      <span className="sr-only">正在整理页面</span>
      <div className="h-52 animate-pulse rounded-[1.75rem] bg-[var(--surface-soft)]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-48 animate-pulse rounded-[1.5rem] bg-[var(--surface-soft)]" />
        <div className="h-48 animate-pulse rounded-[1.5rem] bg-[var(--surface-soft)]" />
      </div>
    </div>
  );
}
