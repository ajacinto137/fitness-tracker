"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import type { Exercise, Prisma } from "@prisma/client";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExercisePickerSheet } from "@/components/lifting/ExercisePickerSheet";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";

type RoutineWithExercises = Prisma.WorkoutRoutineGetPayload<{
  include: { exercises: { include: { exercise: true } } };
}>;

interface RoutineExerciseRow {
  exerciseId: string;
  name: string;
  targetSets: string;
  targetReps: string;
}

export function RoutineEditorScreen({
  routine,
  availableExercises,
}: {
  routine?: RoutineWithExercises;
  availableExercises: Exercise[];
}) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(routine?.name ?? "");
  const [rows, setRows] = useState<RoutineExerciseRow[]>(
    routine?.exercises
      .sort((a, b) => a.order - b.order)
      .map((re) => ({
        exerciseId: re.exerciseId,
        name: re.exercise.name,
        targetSets: re.targetSets?.toString() ?? "3",
        targetReps: re.targetReps?.toString() ?? "10",
      })) ?? []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addExercise(exercise: Exercise) {
    setRows((prev) => [
      ...prev,
      { exerciseId: exercise.id, name: exercise.name, targetSets: "3", targetReps: "10" },
    ]);
    setPickerOpen(false);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function moveRow(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateRow(index: number, field: "targetSets" | "targetReps", value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Routine name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      exercises: rows.map((r, i) => ({
        exerciseId: r.exerciseId,
        order: i,
        targetSets: r.targetSets ? Number(r.targetSets) : null,
        targetReps: r.targetReps ? Number(r.targetReps) : null,
      })),
    };
    try {
      if (routine) {
        await apiSend(`/api/routines/${routine.id}`, "PATCH", payload);
      } else {
        await apiSend("/api/routines", "POST", payload);
      }
      router.push("/lifting/routines");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to save routine.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!routine) return;
    setDeleteOpen(false);
    try {
      await apiSend(`/api/routines/${routine.id}`, "DELETE");
      router.push("/lifting/routines");
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to delete routine.", {
        variant: "error",
      });
    }
  }

  return (
    <div>
      <SubPageHeader
        title={routine ? "Edit Routine" : "New Routine"}
        fallbackHref="/lifting/routines"
        right={
          routine && (
            <button
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete routine"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )
        }
      />

      <div className="space-y-6 px-5 py-5">
        <Input
          id="routine-name"
          label="Routine Name"
          placeholder="e.g. Push Day"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-ink">Exercises</h2>
            <span className="text-sm text-ink-muted">{rows.length}</span>
          </div>

          {rows.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-muted">
              Add exercises to build this routine.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <Card key={`${row.exerciseId}-${index}`} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-4 w-4 shrink-0 text-ink-muted" />
                      <span className="truncate font-medium text-ink">{row.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => moveRow(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2 disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveRow(index, 1)}
                        disabled={index === rows.length - 1}
                        aria-label="Move down"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeRow(index)}
                        aria-label="Remove exercise"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Target Sets"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={row.targetSets}
                      onChange={(e) => updateRow(index, "targetSets", e.target.value)}
                    />
                    <Input
                      label="Target Reps"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={row.targetReps}
                      onChange={(e) => updateRow(index, "targetReps", e.target.value)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Button variant="secondary" fullWidth onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" /> Add Exercise
          </Button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button size="lg" fullWidth onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Routine"}
        </Button>
      </div>

      <ExercisePickerSheet
        open={pickerOpen}
        exercises={availableExercises}
        onClose={() => setPickerOpen(false)}
        onSelect={addExercise}
      />

      {routine && (
        <ConfirmDialog
          open={deleteOpen}
          title="Delete routine?"
          description={`"${routine.name}" will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
