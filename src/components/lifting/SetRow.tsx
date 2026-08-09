"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { clsx } from "clsx";

export interface SetRowData {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

export function SetRow({
  index,
  set,
  previousLabel,
  disabled,
  onChange,
  onDelete,
}: {
  index: number;
  set: SetRowData;
  previousLabel: string | null;
  disabled?: boolean;
  onChange: (patch: Partial<{ weight: string; reps: string; completed: boolean }>) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [syncedWeight, setSyncedWeight] = useState(set.weight);
  const [syncedReps, setSyncedReps] = useState(set.reps);
  const [syncedCompleted, setSyncedCompleted] = useState(set.completed);
  const [justCompleted, setJustCompleted] = useState(false);

  // Keep the editable buffer in sync when the set's server-confirmed value
  // changes for a reason other than this input's own edits (e.g. "Add Set"
  // prefilling from the previous set). Adjusting state during render (rather
  // than in an effect) avoids an extra render pass.
  if (set.weight !== syncedWeight) {
    setSyncedWeight(set.weight);
    setWeight(set.weight);
  }
  if (set.reps !== syncedReps) {
    setSyncedReps(set.reps);
    setReps(set.reps);
  }
  if (set.completed !== syncedCompleted) {
    setSyncedCompleted(set.completed);
    if (set.completed) setJustCompleted(true);
  }

  return (
    <div className="grid grid-cols-[1.5rem_1fr_4.5rem_4rem_2.5rem_2rem] items-center gap-2">
      <span className="text-center text-sm font-medium text-ink-muted">{index + 1}</span>
      <span className="truncate text-sm text-ink-muted">{previousLabel ?? "—"}</span>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        disabled={disabled}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => onChange({ weight })}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 text-center text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash disabled:opacity-60"
      />
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        disabled={disabled}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => onChange({ reps })}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 text-center text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash disabled:opacity-60"
      />
      <button
        onClick={() => onChange({ completed: !set.completed })}
        disabled={disabled}
        aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-lg border transition-all disabled:opacity-60",
          set.completed
            ? "glow-success border-success-strong bg-gradient-success text-accent-ink"
            : "border-border-strong bg-surface-2 text-transparent"
        )}
      >
        <Check
          className={clsx("h-5 w-5", justCompleted && "animate-check-pop")}
          onAnimationEnd={() => setJustCompleted(false)}
        />
      </button>
      {disabled ? (
        <span />
      ) : (
        <button
          onClick={onDelete}
          aria-label="Delete set"
          className="flex h-10 w-8 items-center justify-center text-ink-muted hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
