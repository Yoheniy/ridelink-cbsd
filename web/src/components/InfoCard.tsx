import type { ReactNode } from "react";

type CardTone = "default" | "dark" | "glass";

type InfoCardProps = {
  title: string;
  tone?: CardTone;
  as?: "article" | "div";
  children: ReactNode;
};

const toneClass: Record<CardTone, string> = {
  default: "card",
  dark: "card card--dark",
  glass: "card card--glass"
};

export function InfoCard({
  title,
  tone = "default",
  as: Tag = "article",
  children
}: InfoCardProps) {
  return (
    <Tag className={toneClass[tone]}>
      <h3>{title}</h3>
      {children}
    </Tag>
  );
}
