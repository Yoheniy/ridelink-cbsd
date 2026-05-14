import type { ReactNode } from "react";

type Variant = "primary" | "ghost";

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = ""
}: ButtonLinkProps) {
  const variantClass = variant === "primary" ? "btn--primary" : "btn--ghost";
  return (
    <a className={`btn ${variantClass} ${className}`.trim()} href={href}>
      {children}
    </a>
  );
}
