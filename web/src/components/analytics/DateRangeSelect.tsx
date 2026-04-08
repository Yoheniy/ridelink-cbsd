import { cn } from "@/lib/utils";

type DateRangeSelectProps = {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  className?: string;
};

export default function DateRangeSelect({ start, end, onStartChange, onEndChange, className }: DateRangeSelectProps) {
  const inputClass = "px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <label className="flex items-center gap-2">
        <span className="text-xs text-slate-400">From</span>
        <input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} className={inputClass} />
      </label>
      <label className="flex items-center gap-2">
        <span className="text-xs text-slate-400">To</span>
        <input type="date" value={end} onChange={(e) => onEndChange(e.target.value)} className={inputClass} />
      </label>
    </div>
  );
}
