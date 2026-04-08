import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

type RadialEntry = { name: string; value: number; fill: string };

type RadialChartProps = {
  data: RadialEntry[];
  height?: number;
  className?: string;
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-lg text-xs">
      <span className="font-semibold text-slate-900 dark:text-white">{d.name}</span>
      <span className="ml-2 text-slate-500">{Number(d.value).toLocaleString()}</span>
    </div>
  );
}

export default function RadialChart({ data, height = 280, className }: RadialChartProps) {
  return (
    <div className={cn("", className)} style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          data={data}
          startAngle={180}
          endAngle={-180}
          barSize={14}
        >
          <RadialBar
            background={{ fill: "rgba(15,23,42,0.04)" }}
            dataKey="value"
            cornerRadius={7}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
            )}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
