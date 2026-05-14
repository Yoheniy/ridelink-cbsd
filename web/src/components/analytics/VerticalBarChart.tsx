import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { cn } from "@/lib/utils";

type BarPoint = { name: string; value: number; color: string };

type VerticalBarChartProps = {
  data: BarPoint[];
  height?: number;
  className?: string;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-lg text-xs">
      <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
      <span className="ml-2 text-slate-500">{Number(payload[0].value).toLocaleString()}</span>
    </div>
  );
}

function formatAxis(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
  return String(v);
}

export default function VerticalBarChart({ data, height = 260, className }: VerticalBarChartProps) {
  return (
    <div className={cn("", className)} style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/[0.06]" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAxis}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
