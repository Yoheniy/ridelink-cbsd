import { cn } from "@/lib/utils";

type GaugeItem = {
  label: string;
  value: string;
  pct: number;
  color: string;
};

type ProgressGaugeProps = {
  items: GaugeItem[];
  className?: string;
};

export default function ProgressGauge({ items, className }: ProgressGaugeProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(Math.max(item.pct, 0), 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
