"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Trophy } from "lucide-react";
import type { Exercise, PersonalRecordType, Units } from "@prisma/client";
import { clsx } from "clsx";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconContainer } from "@/components/ui/IconContainer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExerciseFormSheet, type ExerciseFormValues } from "@/components/lifting/ExerciseFormSheet";
import { ProgressChart, type ChartPoint } from "@/components/charts/ProgressChart";
import { TimeRangeTabs } from "@/components/charts/TimeRangeTabs";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";
import { fromKg, formatWeight, roundWeight, unitLabel } from "@/lib/units";
import { startDateForRange, type TimeRangeKey } from "@/lib/calculations";
import { displayDate } from "@/lib/date";
import { MUSCLE_GROUP_LABELS } from "@/lib/muscle-groups";

interface HistoryPoint {
  workoutId: string;
  date: string;
  heaviestWeightKg: number;
  heaviestReps: number;
  estimatedOneRepMaxKg: number;
  volumeKg: number;
}

interface PersonalRecordRow {
  id: string;
  type: PersonalRecordType;
  value: number;
  reps: number | null;
  achievedAt: string;
}

type Metric = "HEAVIEST_WEIGHT" | "ESTIMATED_1RM" | "TOTAL_VOLUME";

const METRICS: { key: Metric; label: string }[] = [
  { key: "HEAVIEST_WEIGHT", label: "Heaviest Weight" },
  { key: "ESTIMATED_1RM", label: "Estimated 1RM" },
  { key: "TOTAL_VOLUME", label: "Total Volume" },
];

const PR_LABELS: Record<PersonalRecordType, string> = {
  HEAVIEST_WEIGHT: "Heaviest Weight",
  ESTIMATED_1RM: "Estimated 1RM",
  WORKOUT_VOLUME: "Workout Volume",
};

export function ExerciseDetailScreen({
  exercise,
  history,
  personalRecords,
  summary,
  units,
}: {
  exercise: Exercise;
  history: HistoryPoint[];
  personalRecords: PersonalRecordRow[];
  summary: {
    lastPerformed: string | null;
    currentBestWeightKg: number;
    currentBestOneRepMaxKg: number;
    recentVolumeKg: number;
  };
  units: Units;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [metric, setMetric] = useState<Metric>("HEAVIEST_WEIGHT");
  const [range, setRange] = useState<TimeRangeKey>("3M");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const chartData: ChartPoint[] = useMemo(() => {
    const startDate = startDateForRange(range);
    return history
      .filter((h) => !startDate || new Date(h.date) >= startDate)
      .map((h) => {
        const value =
          metric === "HEAVIEST_WEIGHT"
            ? fromKg(h.heaviestWeightKg, units)
            : metric === "ESTIMATED_1RM"
              ? fromKg(h.estimatedOneRepMaxKg, units)
              : fromKg(h.volumeKg, units);
        return { date: h.date, value: roundWeight(value), reps: h.heaviestReps };
      });
  }, [history, metric, range, units]);

  async function saveEdit(values: ExerciseFormValues) {
    try {
      await apiSend(`/api/exercises/${exercise.id}`, "PATCH", values);
      router.refresh();
    } catch (err) {
      throw new Error(err instanceof ClientApiError ? err.message : "Unable to update exercise.");
    }
  }

  async function confirmDelete() {
    setDeleteOpen(false);
    try {
      await apiSend(`/api/exercises/${exercise.id}`, "DELETE");
      router.push("/lifting/exercises");
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to delete exercise.", {
        variant: "error",
      });
    }
  }

  return (
    <div>
      <SubPageHeader
        title={exercise.name}
        fallbackHref="/lifting/exercises"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditOpen(true)}
              aria-label="Edit exercise"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete exercise"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <div className="space-y-6 px-5 py-5">
        <Badge variant="strength">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Badge>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Last Performed"
            value={summary.lastPerformed ? displayDate(summary.lastPerformed) : "—"}
          />
          <StatCard
            label="Best Weight"
            value={
              summary.currentBestWeightKg > 0 ? formatWeight(summary.currentBestWeightKg, units) : "—"
            }
            accent={summary.currentBestWeightKg > 0}
            gradient
          />
          <StatCard
            label="Estimated 1RM"
            value={
              summary.currentBestOneRepMaxKg > 0
                ? formatWeight(summary.currentBestOneRepMaxKg, units)
                : "—"
            }
            accent={summary.currentBestOneRepMaxKg > 0}
          />
          <StatCard
            label="Recent Volume"
            value={
              summary.recentVolumeKg > 0
                ? `${Math.round(fromKg(summary.recentVolumeKg, units)).toLocaleString()} ${unitLabel(units)}`
                : "—"
            }
          />
        </div>

        <Card className="space-y-4">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={clsx(
                  "flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  metric === m.key
                    ? "bg-gradient-primary text-accent-ink"
                    : "text-ink-secondary hover:text-ink"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <ProgressChart
            data={chartData}
            series={[
              {
                dataKey: "value",
                label: METRICS.find((m) => m.key === metric)!.label,
                color: "var(--strength)",
                style: "line",
                areaFill: true,
              },
            ]}
            valueFormatter={(v) => `${v} ${unitLabel(units)}`}
            repsKey={metric === "HEAVIEST_WEIGHT" ? "reps" : undefined}
            emptyMessage="Complete this exercise in a workout to see progress here."
          />
          <TimeRangeTabs value={range} onChange={setRange} />
          {metric === "ESTIMATED_1RM" && (
            <p className="text-xs text-ink-muted">
              Estimated 1RM uses the Epley formula and is an estimate, not a measured max.
            </p>
          )}
        </Card>

        {personalRecords.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-gold-soft px-1 font-semibold">Personal Records</h2>
            <div className="space-y-2">
              {personalRecords.map((pr) => (
                <Card key={pr.id} accent="achievement" className="flex items-center gap-3 py-3">
                  <IconContainer icon={Trophy} category="achievement" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{PR_LABELS[pr.type]}</p>
                    <p className="text-sm text-ink-secondary">{displayDate(pr.achievedAt, { year: "numeric" })}</p>
                  </div>
                  <p className="font-semibold text-accent">
                    {formatWeight(pr.value, units)}
                    {pr.reps ? ` × ${pr.reps}` : ""}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(exercise.description || exercise.notes) && (
          <div className="space-y-2">
            {exercise.description && (
              <Card>
                <p className="text-sm font-medium text-ink-secondary">Description</p>
                <p className="mt-1 text-ink">{exercise.description}</p>
              </Card>
            )}
            {exercise.notes && (
              <Card>
                <p className="text-sm font-medium text-ink-secondary">Notes</p>
                <p className="mt-1 text-ink">{exercise.notes}</p>
              </Card>
            )}
          </div>
        )}
      </div>

      <ExerciseFormSheet
        open={editOpen}
        initial={{
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          description: exercise.description ?? "",
          notes: exercise.notes ?? "",
          unilateral: exercise.unilateral,
        }}
        onClose={() => setEditOpen(false)}
        onSubmit={saveEdit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete exercise?"
        description="This removes it from your library. Exercises used in past workouts can't be deleted."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  gradient,
}: {
  label: string;
  value: string;
  accent?: boolean;
  gradient?: boolean;
}) {
  return (
    <Card className="py-3">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p
        className={clsx(
          "mt-1 text-lg font-semibold",
          gradient && accent ? "text-gradient-strength" : accent ? "text-strength" : "text-ink"
        )}
      >
        {value}
      </p>
    </Card>
  );
}
