import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[rgba(15,23,42,0.08)] shadcn-skeleton-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
