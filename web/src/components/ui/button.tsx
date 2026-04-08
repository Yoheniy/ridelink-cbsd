import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const variantClass: Record<string, string> = {
  default: "bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-600/20 hover:shadow-xl",
  destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
  outline: "border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5",
  ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5",
  secondary: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15",
};

const sizeClass: Record<string, string> = {
  default: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
  lg: "px-7 py-3 text-base",
  icon: "w-9 h-9 p-0 flex items-center justify-center",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
