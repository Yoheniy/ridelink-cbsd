import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  className?: string;
};

export default function MetricCard({ label, value, trend, className }: MetricCardProps) {
  const trendUp = trend != null && trend.value > 0;
  const trendDown = trend != null && trend.value < 0;
  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-display font-bold text-2xl mt-1 text-slate-900 dark:text-white">{value}</p>
      {trend != null && (
        <p className={cn(
          "text-xs mt-1 font-medium",
          trendUp && "text-eco-500",
          trendDown && "text-red-500",
          !trendUp && !trendDown && "text-slate-400"
        )}>
          {trendUp ? "↑" : trendDown ? "↓" : ""} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}
