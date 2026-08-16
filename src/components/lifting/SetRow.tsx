"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { clsx } from "clsx";

export interface SetRowData {
  id: string;
  weight: string;
  reps: string;
  weightRight: string;
  repsRight: string;
  completed: boolean;
}

type SetPatch = Partial<{
  weight: string;
  reps: string;
  weightRight: string;
  repsRight: string;
  completed: boolean;
}>;

export function SetRow({
  index,
  set,
  previousLabel,
  unilateral = false,
  unitLabel,
  disabled,
  onChange,
  onDelete,
}: {
  index: number;
  set: SetRowData;
  previousLabel: string | null;
  /** Renders separate left/right weight+reps inputs for single arm/leg exercises. */
  unilateral?: boolean;
  unitLabel?: string;
  disabled?: boolean;
  onChange: (patch: SetPatch) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [weightRight, setWeightRight] = useState(set.weightRight);
  const [repsRight, setRepsRight] = useState(set.repsRight);
  const [syncedWeight, setSyncedWeight] = useState(set.weight);
  const [syncedReps, setSyncedReps] = useState(set.reps);
  const [syncedWeightRight, setSyncedWeightRight] = useState(set.weightRight);
  const [syncedRepsRight, setSyncedRepsRight] = useState(set.repsRight);
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
  if (set.weightRight !== syncedWeightRight) {
    setSyncedWeightRight(set.weightRight);
    setWeightRight(set.weightRight);
  }
  if (set.repsRight !== syncedRepsRight) {
    setSyncedRepsRight(set.repsRight);
    setRepsRight(set.repsRight);
  }
  if (set.completed !== syncedCompleted) {
    setSyncedCompleted(set.completed);
    if (set.completed) setJustCompleted(true);
  }

  const completeButton = (
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
  );

  if (!unilateral) {
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
        {completeButton}
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

  return (
    <div className="space-y-1.5 rounded-xl border border-border-strong/60 bg-surface-2/40 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-muted">Set {index + 1}</span>
        <div className="flex items-center gap-1.5">
          {completeButton}
          {!disabled && (
            <button
              onClick={onDelete}
              aria-label="Delete set"
              className="flex h-10 w-8 items-center justify-center text-ink-muted hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {previousLabel && <p className="truncate text-xs text-ink-muted">Previous — {previousLabel}</p>}
      <div className="grid grid-cols-[1.25rem_1fr_1fr] gap-2 px-0.5 text-xs font-medium text-ink-muted">
        <span />
        <span className="text-center">{unitLabel ?? "Weight"}</span>
        <span className="text-center">Reps</span>
      </div>
      <SideInputs
        label="L"
        weight={weight}
        reps={reps}
        disabled={disabled}
        onWeightChange={setWeight}
        onRepsChange={setReps}
        onWeightBlur={() => onChange({ weight })}
        onRepsBlur={() => onChange({ reps })}
      />
      <SideInputs
        label="R"
        weight={weightRight}
        reps={repsRight}
        disabled={disabled}
        onWeightChange={setWeightRight}
        onRepsChange={setRepsRight}
        onWeightBlur={() => onChange({ weightRight })}
        onRepsBlur={() => onChange({ repsRight })}
      />
    </div>
  );
}

function SideInputs({
  label,
  weight,
  reps,
  disabled,
  onWeightChange,
  onRepsChange,
  onWeightBlur,
  onRepsBlur,
}: {
  label: string;
  weight: string;
  reps: string;
  disabled?: boolean;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onWeightBlur: () => void;
  onRepsBlur: () => void;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_1fr_1fr] items-center gap-2">
      <span className="text-center text-xs font-semibold text-strength-soft">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        disabled={disabled}
        onChange={(e) => onWeightChange(e.target.value)}
        onBlur={onWeightBlur}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 text-center text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash disabled:opacity-60"
      />
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        disabled={disabled}
        onChange={(e) => onRepsChange(e.target.value)}
        onBlur={onRepsBlur}
        className="h-10 w-full rounded-lg border border-border-strong bg-surface-2 text-center text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash disabled:opacity-60"
      />
    </div>
  );
}
