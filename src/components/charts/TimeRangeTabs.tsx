"use client";

import { clsx } from "clsx";
import type { TimeRangeKey } from "@/lib/calculations";

const ranges: TimeRangeKey[] = ["1M", "3M", "6M", "1Y", "ALL"];

export function TimeRangeTabs({
  value,
  onChange,
}: {
  value: TimeRangeKey;
  onChange: (range: TimeRangeKey) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={clsx(
            "flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors",
            value === r ? "bg-gradient-primary text-accent-ink" : "text-ink-secondary hover:text-ink"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
