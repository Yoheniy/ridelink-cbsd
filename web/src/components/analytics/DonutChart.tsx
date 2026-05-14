import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type Slice = { name: string; value: number; color: string };

type DonutChartProps = {
  data: Slice[];
  height?: number;
  centerLabel?: string;
  className?: string;
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0];
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-lg text-xs">
      <span className="font-semibold text-slate-900 dark:text-white">{d.name}</span>
      <span className="ml-2 text-slate-500">{Number(d.value).toLocaleString()}</span>
    </div>
  );
}

export default function DonutChart({ data, height = 260, centerLabel, className }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={cn("relative", className)} style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="55%"
            outerRadius="80%"
            dataKey="value"
            strokeWidth={2}
            stroke="transparent"
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: height * 0.15 }}>
          <span className="font-display font-bold text-2xl text-slate-900 dark:text-white">{total.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}
