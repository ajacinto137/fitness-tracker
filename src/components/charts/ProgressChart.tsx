"use client";

import { Fragment, useId } from "react";
import {
  Line,
  Area,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { displayDate } from "@/lib/date";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export interface ChartPoint {
  date: string;
  [key: string]: number | string | undefined;
}

export interface ChartSeriesConfig {
  dataKey: string;
  label: string;
  color: string;
  style: "line" | "dots";
  /** Fill the area under the line with a fade-to-transparent gradient of `color`. */
  areaFill?: boolean;
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
    <div className="rounded-xl border border-border-strong bg-surface-elevated px-3 py-2">
      <p className="text-xs font-medium text-ink-secondary">{displayDate(label as string)}</p>
      {series.map((s) => {
        const value = point[s.dataKey];
        if (value === undefined || value === null) return null;
        return (
          <p key={s.dataKey} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            {valueFormatter(Number(value))}
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
  const gradientId = useId();
  const reducedMotion = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ink-muted">
        {emptyMessage}
      </div>
    );
  }

  const lastIndex = data.length - 1;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.dataKey} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
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
          {series.map((s, i) =>
            s.style === "dots" ? (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke="transparent"
                dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: s.color }}
                isAnimationActive={!reducedMotion}
                animationDuration={400}
                connectNulls
              />
            ) : (
              <Fragment key={s.dataKey}>
                {s.areaFill && (
                  <Area
                    key={`${s.dataKey}-area`}
                    type="monotone"
                    dataKey={s.dataKey}
                    stroke="none"
                    fill={`url(#${gradientId}-${i})`}
                    isAnimationActive={!reducedMotion}
                    animationDuration={400}
                    connectNulls
                  />
                )}
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  stroke={s.color}
                  strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 0 4px color-mix(in srgb, ${s.color} 65%, transparent))` }}
                  dot={(props: { cx?: number; cy?: number; index?: number; key?: React.Key | null }) => {
                    const { cx, cy, index, key } = props;
                    if (index !== lastIndex || cx === undefined || cy === undefined) {
                      return <g key={key ?? undefined} />;
                    }
                    return (
                      <g key={key ?? undefined}>
                        <circle cx={cx} cy={cy} r={7} fill={s.color} fillOpacity={0.18} />
                        <circle cx={cx} cy={cy} r={3.5} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} />
                      </g>
                    );
                  }}
                  activeDot={{ r: 5, fill: s.color, stroke: "var(--surface)", strokeWidth: 1.5 }}
                  isAnimationActive={!reducedMotion}
                  animationDuration={400}
                  connectNulls
                />
              </Fragment>
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
