"use client";

import { useState } from "react";
import type { MuscleGroup } from "@prisma/client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/lib/muscle-groups";
import { clsx } from "clsx";

export interface ExerciseFormValues {
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
  notes: string;
}

interface ExerciseFormSheetProps {
  open: boolean;
  initial?: ExerciseFormValues;
  onClose: () => void;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
}

const empty: ExerciseFormValues = { name: "", muscleGroup: "OTHER", description: "", notes: "" };

export function ExerciseFormSheet({ open, initial, onClose, onSubmit }: ExerciseFormSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={initial ? "Edit Exercise" : "New Exercise"}>
      {/* Keying by open forces a fresh mount (and fresh initial state) each
          time the sheet is opened, instead of syncing state via an effect. */}
      <ExerciseForm
        key={open ? initial?.name ?? "new" : "closed"}
        initial={initial}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

function ExerciseForm({
  initial,
  onClose,
  onSubmit,
}: Omit<ExerciseFormSheetProps, "open">) {
  const [values, setValues] = useState<ExerciseFormValues>(initial ?? empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Exercise name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save exercise.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="exercise-name"
        label="Exercise Name"
        placeholder="e.g. Bench Press"
        autoFocus
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-secondary">Muscle Group</label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setValues((v) => ({ ...v, muscleGroup: g }))}
              className={clsx(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                values.muscleGroup === g
                  ? "bg-gradient-primary text-accent-ink"
                  : "bg-surface-2 text-ink-secondary hover:text-ink"
              )}
            >
              {MUSCLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        id="exercise-description"
        label="Description (optional)"
        placeholder="How to perform this exercise"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
      />
      <Textarea
        id="exercise-notes"
        label="Notes (optional)"
        placeholder="Personal notes or cues"
        value={values.notes}
        onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" fullWidth size="lg" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
