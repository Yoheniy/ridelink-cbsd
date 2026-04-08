import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroProps = {
  /** Short eyebrow label above the headline */
  eyebrow?: string;
  /** Main headline */
  headline: string;
  /** Supporting paragraph */
  description?: string;
  /** Primary CTA (e.g. "Get Started") */
  primaryAction?: ReactNode;
  /** Secondary CTA (e.g. "Learn more") */
  secondaryAction?: ReactNode;
  /** Optional right column (image, mockup, etc.) */
  aside?: ReactNode;
  className?: string;
};

export function Hero({
  eyebrow,
  headline,
  description,
  primaryAction,
  secondaryAction,
  aside,
  className,
}: HeroProps) {
  return (
    <section className={cn("rl-hero", className)}>
      <div className="rl-hero__inner">
        <div className="rl-hero__content">
          {eyebrow && <p className="rl-hero__eyebrow">{eyebrow}</p>}
          <h1 className="rl-hero__headline">{headline}</h1>
          {description && <p className="rl-hero__desc">{description}</p>}
          <div className="rl-hero__actions">
            {primaryAction}
            {secondaryAction}
          </div>
        </div>
        {aside && <div className="rl-hero__aside">{aside}</div>}
      </div>
    </section>
  );
}
