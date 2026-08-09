"use client";

import { Trophy } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconContainer } from "@/components/ui/IconContainer";
import { fromKg, formatWeight, unitLabel } from "@/lib/units";
import { formatDurationShort } from "@/lib/duration";
import type { Units } from "@prisma/client";

export interface WorkoutSummary {
  durationMs: number;
  exercisesCompleted: number;
  totalSets: number;
  totalVolumeKg: number;
  newRecords: { exerciseName: string; type: string; value: number; reps?: number }[];
}

export function FinishSummarySheet({
  summary,
  units,
  onClose,
}: {
  summary: WorkoutSummary | null;
  units: Units;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!summary} onClose={onClose} title="Workout Complete">
      {summary && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <SummaryStat label="Duration" value={formatDurationShort(summary.durationMs)} />
            <SummaryStat label="Exercises" value={String(summary.exercisesCompleted)} color="strength" />
            <SummaryStat label="Total Sets" value={String(summary.totalSets)} color="strength" />
            <SummaryStat
              label="Total Volume"
              value={`${Math.round(fromKg(summary.totalVolumeKg, units)).toLocaleString()} ${unitLabel(units)}`}
              color="accent"
            />
          </div>

          {summary.newRecords.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-sm font-semibold text-ink-secondary">New Personal Records</h3>
              {summary.newRecords.map((r, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-gold-wash bg-surface-2 px-3 py-2.5"
                >
                  <span className="bg-gradient-achievement absolute inset-y-0 left-0 w-1" aria-hidden />
                  <IconContainer icon={Trophy} category="achievement" size="sm" />
                  <p className="min-w-0 flex-1 text-sm text-ink">
                    <span className="text-gold font-semibold">{r.exerciseName}</span> —{" "}
                    <span className="font-semibold text-accent">{formatWeight(r.value, units)}</span>
                    {r.reps ? ` × ${r.reps}` : ""}
                  </p>
                  <Badge variant="achievement">PR</Badge>
                </div>
              ))}
            </div>
          )}

          <Button size="lg" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Sheet>
  );
}

const summaryColorClass: Record<"strength" | "accent", string> = {
  strength: "text-strength",
  accent: "text-accent",
};

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "strength" | "accent";
}) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3 text-center">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color ? summaryColorClass[color] : "text-ink"}`}>{value}</p>
    </div>
  );
}
