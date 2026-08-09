import { ArrowDown, ArrowUp } from "lucide-react";
import { clsx } from "clsx";

export type TrendColor = "strength" | "weight" | "success" | "primary" | "neutral";

const colorClass: Record<TrendColor, string> = {
  strength: "text-strength",
  weight: "text-weight",
  success: "text-success",
  primary: "text-accent",
  neutral: "text-ink-secondary",
};

export function TrendStat({
  label,
  value,
  direction,
  color = "neutral",
}: {
  label: string;
  value: string;
  direction?: "up" | "down" | null;
  color?: TrendColor;
}) {
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : null;
  return (
    <div>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={clsx("mt-0.5 flex items-center justify-center gap-0.5 text-sm font-semibold", colorClass[color])}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {value}
      </p>
    </div>
  );
}
