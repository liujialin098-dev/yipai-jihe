export default function InspirationLoading() {
  return (
    <div className="px-5 pt-6" aria-busy="true">
      <h1 className="app-page-title">时尚灵感</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        正在整理来源内容，衣橱和推荐仍可正常使用。
      </p>
      <div className="mt-6 h-52 rounded-3xl bg-[var(--fashion-lilac-soft)]" />
    </div>
  );
}
