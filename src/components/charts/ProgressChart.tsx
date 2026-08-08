"use client";

import {
  Line,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { displayDate } from "@/lib/date";

export interface ChartPoint {
  date: string;
  [key: string]: number | string | undefined;
}

export interface ChartSeriesConfig {
  dataKey: string;
  label: string;
  color: string;
  style: "line" | "dots";
}

interface ProgressChartProps {
  data: ChartPoint[];
  series: ChartSeriesConfig[];
  valueFormatter?: (value: number) => string;
  repsKey?: string;
  emptyMessage?: string;
}

interface TooltipRenderProps {
  active?: boolean;
  label?: string | number;
  payload?: { payload: ChartPoint }[];
}

function CustomTooltip({
  active,
  payload,
  label,
  series,
  valueFormatter,
  repsKey,
}: TooltipRenderProps & {
  series: ChartSeriesConfig[];
  valueFormatter: (v: number) => string;
  repsKey?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-border-strong bg-surface-2 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-ink-secondary">{displayDate(label as string)}</p>
      {series.map((s) => {
        const value = point[s.dataKey];
        if (value === undefined || value === null) return null;
        return (
          <p key={s.dataKey} className="text-sm font-semibold text-ink">
            {s.label}: {valueFormatter(Number(value))}
            {repsKey && point[repsKey] ? ` × ${point[repsKey]}` : ""}
          </p>
        );
      })}
    </div>
  );
}

export function ProgressChart({
  data,
  series,
  valueFormatter = (v) => String(v),
  repsKey,
  emptyMessage = "Not enough data yet.",
}: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ink-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => displayDate(v)}
            stroke="var(--ink-muted)"
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            stroke="var(--ink-muted)"
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={((props: TooltipRenderProps) => (
              <CustomTooltip {...props} series={series} valueFormatter={valueFormatter} repsKey={repsKey} />
            )) as never}
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
          />
          {series.map((s) =>
            s.style === "dots" ? (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke="transparent"
                dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: s.color }}
                isAnimationActive={false}
                connectNulls
              />
            ) : (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: s.color }}
                isAnimationActive={false}
                connectNulls
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
