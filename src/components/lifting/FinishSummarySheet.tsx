"use client";

import { Trophy } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { fromKg, roundWeight, unitLabel } from "@/lib/units";
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
            <SummaryStat label="Exercises" value={String(summary.exercisesCompleted)} />
            <SummaryStat label="Total Sets" value={String(summary.totalSets)} />
            <SummaryStat
              label="Total Volume"
              value={`${Math.round(fromKg(summary.totalVolumeKg, units)).toLocaleString()} ${unitLabel(units)}`}
            />
          </div>

          {summary.newRecords.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-sm font-semibold text-ink-secondary">New Personal Records</h3>
              {summary.newRecords.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-warning/40 bg-surface-2 px-3 py-2.5"
                >
                  <Trophy className="h-5 w-5 shrink-0 text-warning" />
                  <p className="text-sm text-ink">
                    <span className="font-semibold">{r.exerciseName}</span> —{" "}
                    {roundWeight(fromKg(r.value, units))} {unitLabel(units)}
                    {r.reps ? ` × ${r.reps}` : ""}
                  </p>
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3 text-center">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
