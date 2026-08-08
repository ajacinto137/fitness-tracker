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
  onChange,
  onDelete,
}: {
  index: number;
  set: SetRowData;
  previousLabel: string | null;
  onChange: (patch: Partial<{ weight: string; reps: string; completed: boolean }>) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [syncedWeight, setSyncedWeight] = useState(set.weight);
  const [syncedReps, setSyncedReps] = useState(set.reps);

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

  return (
    <div className="grid grid-cols-[1.5rem_1fr_4.5rem_4rem_2.5rem_2rem] items-center gap-2">
      <span className="text-center text-sm font-medium text-ink-muted">{index + 1}</span>
      <span className="truncate text-sm text-ink-muted">{previousLabel ?? "—"}</span>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => onChange({ weight })}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 text-center text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash"
      />
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => onChange({ reps })}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 text-center text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash"
      />
      <button
        onClick={() => onChange({ completed: !set.completed })}
        aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
          set.completed
            ? "border-accent-strong bg-accent-strong text-white"
            : "border-border-strong bg-surface-2 text-transparent"
        )}
      >
        <Check className="h-5 w-5" />
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete set"
        className="flex h-10 w-8 items-center justify-center text-ink-muted hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
