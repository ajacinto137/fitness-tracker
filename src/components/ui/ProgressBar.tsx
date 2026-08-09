import { clsx } from "clsx";

export type ProgressGradient = "primary" | "strength" | "weight" | "success" | "achievement";

export function ProgressBar({
  value,
  max = 100,
  gradient = "primary",
  className,
}: {
  value: number;
  max?: number;
  gradient?: ProgressGradient;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className={clsx("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className={clsx("h-full rounded-full transition-[width] duration-300 ease-out", `bg-gradient-${gradient}`)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
