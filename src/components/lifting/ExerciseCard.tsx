"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Plus, Trash2, NotebookPen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { SetRow, type SetRowData } from "@/components/lifting/SetRow";
import { unitLabel } from "@/lib/units";
import type { Units } from "@prisma/client";

export function ExerciseCard({
  exerciseId,
  exerciseName,
  notes,
  sets,
  previousSets,
  units,
  canReorder,
  isFirst,
  isLast,
  readOnly,
  onSetChange,
  onSetDelete,
  onAddSet,
  onRemoveExercise,
  onNotesChange,
  onNotesBlur,
  onMove,
}: {
  exerciseId: string;
  exerciseName: string;
  notes: string;
  sets: SetRowData[];
  previousSets: { weightKg: number; reps: number }[] | null;
  units: Units;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  readOnly?: boolean;
  onSetChange: (setId: string, patch: Partial<{ weight: string; reps: string; completed: boolean }>) => void;
  onSetDelete: (setId: string) => void;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onNotesChange: (notes: string) => void;
  onNotesBlur?: () => void;
  onMove?: (direction: -1 | 1) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(!!notes);

  const previousLabel = previousSets
    ? previousSets.map((s) => `${Math.round(s.weightKg * 10) / 10} × ${s.reps}`).join(", ")
    : null;

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/lifting/exercises/${exerciseId}`}
          className="min-w-0 truncate font-semibold uppercase tracking-wide text-ink hover:text-accent-soft"
        >
          {exerciseName}
        </Link>
        {!readOnly && (
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
          Previous: <span className="text-ink-muted">{previousLabel}</span>
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
        <div className="grid grid-cols-[1.5rem_1fr_4.5rem_4rem_2.5rem_2rem] gap-2 px-0.5 text-xs font-medium text-ink-muted">
          <span className="text-center">Set</span>
          <span>Previous</span>
          <span className="text-center">{unitLabel(units)}</span>
          <span className="text-center">Reps</span>
          <span className="text-center">✓</span>
          <span />
        </div>
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            index={index}
            set={set}
            previousLabel={
              previousSets?.[index]
                ? `${Math.round(previousSets[index].weightKg * 10) / 10} × ${previousSets[index].reps}`
                : null
            }
            onChange={(patch) => onSetChange(set.id, patch)}
            onDelete={() => onSetDelete(set.id)}
          />
        ))}
      </div>

      <button
        onClick={onAddSet}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong py-2.5 text-sm font-medium text-ink-secondary hover:text-ink"
      >
        <Plus className="h-4 w-4" /> Add Set
      </button>
    </Card>
  );
}
