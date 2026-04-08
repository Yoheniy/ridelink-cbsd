import * as React from "react";
import { cn } from "@/lib/utils";

const variantClass: Record<string, string> = {
  default: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400",
  secondary: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  destructive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  outline: "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold",
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
