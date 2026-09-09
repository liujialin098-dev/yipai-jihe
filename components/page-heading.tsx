import type { ReactNode } from "react";

/** Full-width title: metadata never shifts its visual center. */
export function PageHeading({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="app-page-heading">
      {meta ? <div className="app-page-meta">{meta}</div> : null}
      <h1 className="app-page-title">{title}</h1>
      {children}
    </header>
  );
}
