export default function StickerStudioLoading() {
  return (
    <div className="page-enter px-5 pt-4">
      <span className="sr-only">正在打开衣物贴纸册</span>
      <div className="h-8 w-36 animate-pulse rounded-full bg-[var(--surface-soft)]" />
      <div className="mt-5 aspect-[4/3] animate-pulse rounded-[2rem] bg-[var(--fashion-lilac-soft)]" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-44 animate-pulse rounded-[1.5rem] bg-[var(--surface-soft)]" />
        <div className="h-44 animate-pulse rounded-[1.5rem] bg-[var(--surface-soft)]" />
      </div>
    </div>
  );
}
