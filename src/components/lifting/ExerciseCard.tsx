"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Plus, Trash2, NotebookPen, Check, CheckCircle2, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { SetRow, type SetRowData } from "@/components/lifting/SetRow";
import { MarqueeText } from "@/components/ui/MarqueeText";
import { formatWeight, unitLabel } from "@/lib/units";
import type { Units } from "@prisma/client";

interface PreviousSet {
  weightKg: number;
  reps: number;
  weightKgRight: number | null;
  repsRight: number | null;
}

function formatPreviousSet(s: PreviousSet, units: Units, unilateral: boolean): string {
  const left = `${formatWeight(s.weightKg, units)} × ${s.reps}`;
  if (!unilateral) return left;
  const right = s.weightKgRight != null ? `${formatWeight(s.weightKgRight, units)} × ${s.repsRight ?? 0}` : null;
  return right ? `L ${left}, R ${right}` : `L ${left}`;
}

export function ExerciseCard({
  exerciseId,
  exerciseName,
  notes,
  sets,
  previousSets,
  units,
  unilateral = false,
  canReorder,
  isFirst,
  isLast,
  completed = false,
  workoutFinished = false,
  isLastIncomplete = false,
  isCurrent = false,
  completing = false,
  onSetChange,
  onSetDelete,
  onAddSet,
  onRemoveExercise,
  onNotesChange,
  onNotesBlur,
  onMove,
  onComplete,
  onReopen,
}: {
  exerciseId: string;
  exerciseName: string;
  notes: string;
  sets: SetRowData[];
  previousSets: PreviousSet[] | null;
  units: Units;
  unilateral?: boolean;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  completed?: boolean;
  workoutFinished?: boolean;
  isLastIncomplete?: boolean;
  isCurrent?: boolean;
  completing?: boolean;
  onSetChange: (
    setId: string,
    patch: Partial<{ weight: string; reps: string; weightRight: string; repsRight: string; completed: boolean }>
  ) => void;
  onSetDelete: (setId: string) => void;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onNotesChange: (notes: string) => void;
  onNotesBlur?: () => void;
  onMove?: (direction: -1 | 1) => void;
  onComplete?: () => void;
  onReopen?: () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(!!notes);

  const locked = completed && !workoutFinished;
  const highlighted = isCurrent && !locked && !workoutFinished;

  const previousLabel = previousSets
    ? previousSets.map((s) => formatPreviousSet(s, units, unilateral)).join("; ")
    : null;

  return (
    <Card
      accent={highlighted ? "primary" : "none"}
      elevated={highlighted}
      className={clsx("space-y-3 transition-opacity", locked && "opacity-75")}
    >
      {locked && <div className="pointer-events-none absolute inset-0 bg-success-wash" aria-hidden />}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/lifting/exercises/${exerciseId}`}
            className="text-strength-soft min-w-0 font-semibold uppercase tracking-wide hover:text-accent-soft"
          >
            <MarqueeText text={exerciseName} />
          </Link>
          {locked && (
            <Badge variant="success" icon={CheckCircle2}>
              Completed
            </Badge>
          )}
        </div>
        {!locked && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setNotesOpen((v) => !v)}
              aria-label="Toggle notes"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
            >
              <NotebookPen className="h-4 w-4" />
            </button>
            {canReorder && onMove && (
              <>
                <button
                  onClick={() => onMove(-1)}
                  disabled={isFirst}
                  aria-label="Move up"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onMove(1)}
                  disabled={isLast}
                  aria-label="Move down"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={onRemoveExercise}
              aria-label="Remove exercise"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {previousLabel && (
        <p className="text-sm text-ink-secondary">
          Previous: <span className="text-strength-muted">{previousLabel}</span>
        </p>
      )}

      {notesOpen && (
        <Textarea
          placeholder="Notes for this exercise (e.g. shoulder felt tight)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          onBlur={onNotesBlur}
          className="min-h-16"
        />
      )}

      <div className="space-y-2">
        {!unilateral && (
          <div className="grid grid-cols-[1.5rem_1fr_4.5rem_4rem_2.5rem_2rem] gap-2 px-0.5 text-xs font-medium text-ink-muted">
            <span className="text-center">Set</span>
            <span>Previous</span>
            <span className="text-center">{unitLabel(units)}</span>
            <span className="text-center">Reps</span>
            <span className="text-center">✓</span>
            <span />
          </div>
        )}
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            index={index}
            set={set}
            unilateral={unilateral}
            unitLabel={unitLabel(units)}
            previousLabel={previousSets?.[index] ? formatPreviousSet(previousSets[index], units, unilateral) : null}
            disabled={locked}
            onChange={(patch) => onSetChange(set.id, patch)}
            onDelete={() => onSetDelete(set.id)}
          />
        ))}
      </div>

      {!locked && (
        <button
          onClick={onAddSet}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong py-2.5 text-sm font-medium text-ink-secondary hover:text-ink"
        >
          <Plus className="h-4 w-4" /> Add Set
        </button>
      )}

      {!workoutFinished &&
        (completed ? (
          <Button variant="secondary" fullWidth onClick={onReopen}>
            <RotateCcw className="h-4 w-4" /> Reopen Exercise
          </Button>
        ) : (
          <Button fullWidth gradient="success" onClick={onComplete} disabled={completing}>
            <Check className="h-4 w-4" />
            {completing ? "Saving..." : isLastIncomplete ? "Finish Workout" : "Complete Exercise"}
          </Button>
        ))}
    </Card>
  );
}
