export default function RecommendationsLoading() {
  return (
    <section className="px-5 pt-4" aria-label="正在准备推荐">
      <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--surface-soft)]" />
      <div className="mt-3 h-12 w-64 animate-pulse rounded-[1rem] bg-[var(--surface-soft)]" />
      <div className="mt-7 h-64 animate-pulse rounded-[1.75rem] bg-[var(--surface-soft)]" />
      <div className="mt-5 h-96 animate-pulse rounded-[1.75rem] bg-[var(--surface-soft)]" />
    </section>
  );
}
