import type { ReactNode } from "react";

type SectionBlockProps = {
  title?: string;
  subtitle?: string;
  accent?: boolean;
  children: ReactNode;
};

export function SectionBlock({
  title,
  subtitle,
  accent,
  children
}: SectionBlockProps) {
  const sectionClass = accent ? "section section--accent" : "section";
  return (
    <section className={sectionClass}>
      {title ? (
        <div className="section__header">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
