import { cn } from "@/lib/utils";

type Status = "healthy" | "warning" | "critical";

type HealthIndicatorProps = {
  label: string;
  status: Status;
  value?: string;
  className?: string;
};

const dotColor: Record<Status, string> = {
  healthy: "bg-eco-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

export default function HealthIndicator({ label, status, value, className }: HealthIndicatorProps) {
  return (
    <div className={cn("glass rounded-xl px-4 py-2.5 flex items-center gap-2.5", className)}>
      <span className={cn("w-2 h-2 rounded-full", dotColor[status])} aria-hidden />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {value != null && <span className="text-xs text-slate-400 ml-auto">{value}</span>}
    </div>
  );
}
