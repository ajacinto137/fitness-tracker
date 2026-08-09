"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Trash2, Plus, NotebookPen } from "lucide-react";
import type { Exercise, Units } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExerciseCard } from "@/components/lifting/ExerciseCard";
import { ExercisePickerSheet } from "@/components/lifting/ExercisePickerSheet";
import { RestTimerBar } from "@/components/lifting/RestTimerBar";
import { FinishSummarySheet, type WorkoutSummary } from "@/components/lifting/FinishSummarySheet";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";
import { fromKg, roundWeight, formatWeight } from "@/lib/units";
import { formatDuration } from "@/lib/duration";
import type { SetRowData } from "@/components/lifting/SetRow";

interface SetInput {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

interface ExerciseInput {
  id: string;
  order: number;
  notes: string | null;
  completed: boolean;
  exercise: { id: string; name: string };
  sets: SetInput[];
}

interface WorkoutInput {
  id: string;
  name: string;
  notes: string | null;
  startedAt: string;
  finishedAt: string | null;
  exercises: ExerciseInput[];
}

interface ExerciseState {
  weId: string;
  exerciseId: string;
  exerciseName: string;
  notes: string;
  completed: boolean;
  sets: SetRowData[];
}

function toSetRow(s: SetInput, units: Units): SetRowData {
  return {
    id: s.id,
    weight: s.weightKg > 0 ? String(roundWeight(fromKg(s.weightKg, units))) : "",
    reps: s.reps > 0 ? String(s.reps) : "",
    completed: s.completed,
  };
}

export function ActiveWorkoutScreen({
  workout,
  previousByExercise,
  availableExercises,
  units,
}: {
  workout: WorkoutInput;
  previousByExercise: Record<string, { date: string; sets: { weightKg: number; reps: number }[] } | null>;
  availableExercises: Exercise[];
  units: Units;
}) {
  const router = useRouter();
  const { show } = useToast();

  const [name, setName] = useState(workout.name);
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [notesOpen, setNotesOpen] = useState(!!workout.notes);
  const [finishedAt, setFinishedAt] = useState(workout.finishedAt);
  const [exercises, setExercises] = useState<ExerciseState[]>(
    workout.exercises
      .sort((a, b) => a.order - b.order)
      .map((we) => ({
        weId: we.id,
        exerciseId: we.exercise.id,
        exerciseName: we.exercise.name,
        notes: we.notes ?? "",
        completed: we.completed,
        sets: we.sets.map((s) => toSetRow(s, units)),
      }))
  );
  const [completingId, setCompletingId] = useState<string | null>(null);
  const exerciseRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [previousMap, setPreviousMap] = useState(previousByExercise);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  const [deleteWorkoutOpen, setDeleteWorkoutOpen] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (finishedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [finishedAt]);

  const durationMs = useMemo(() => {
    const end = finishedAt ? new Date(finishedAt).getTime() : now;
    return Math.max(0, end - new Date(workout.startedAt).getTime());
  }, [finishedAt, now, workout.startedAt]);

  function updateExercise(weId: string, patch: Partial<ExerciseState>) {
    setExercises((prev) => prev.map((ex) => (ex.weId === weId ? { ...ex, ...patch } : ex)));
  }

  async function saveWorkoutMeta(patch: { name?: string; notes?: string | null }) {
    try {
      await apiSend(`/api/workouts/${workout.id}`, "PATCH", patch);
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to save changes.", { variant: "error" });
    }
  }

  async function handleSetChange(
    weId: string,
    setId: string,
    patch: Partial<{ weight: string; reps: string; completed: boolean }>
  ) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.weId === weId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : ex
      )
    );

    // The set API stores weightKg and converts from the user's display unit
    // itself (see /api/sets/[id]), so this must send the raw entered number —
    // converting here too would double-convert and corrupt the stored value.
    const body: { weight?: number; reps?: number; completed?: boolean } = {};
    if (patch.weight !== undefined) body.weight = patch.weight ? Number(patch.weight) : 0;
    if (patch.reps !== undefined) body.reps = patch.reps ? Number(patch.reps) : 0;
    if (patch.completed !== undefined) body.completed = patch.completed;

    try {
      const { newPR } = await apiSend<{
        newPR: { type: string; value: number; reps: number; exerciseName: string } | null;
      }>(`/api/sets/${setId}`, "PATCH", body);
      if (newPR) {
        show(`New PR — ${newPR.exerciseName}`, {
          variant: "pr",
          description: `${formatWeight(newPR.value, units)}${
            newPR.type === "HEAVIEST_WEIGHT" ? ` × ${newPR.reps}` : ""
          }`,
        });
      }
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to save set.", { variant: "error" });
    }
  }

  async function handleExerciseNotesBlur(weId: string) {
    const exercise = exercises.find((e) => e.weId === weId);
    try {
      await apiSend(`/api/workouts/${workout.id}/exercises/${weId}`, "PATCH", {
        notes: exercise?.notes || null,
      });
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to save notes.", { variant: "error" });
    }
  }

  async function handleAddSet(weId: string) {
    try {
      const { set } = await apiSend<{ set: SetInput }>(
        `/api/workouts/${workout.id}/exercises/${weId}/sets`,
        "POST"
      );
      updateExercise(weId, {
        sets: [...(exercises.find((e) => e.weId === weId)?.sets ?? []), toSetRow(set, units)],
      });
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to add set.", { variant: "error" });
    }
  }

  async function handleDeleteSet(weId: string, setId: string) {
    const exercise = exercises.find((e) => e.weId === weId);
    if (!exercise) return;
    updateExercise(weId, { sets: exercise.sets.filter((s) => s.id !== setId) });
    try {
      await apiSend(`/api/sets/${setId}`, "DELETE");
    } catch (err) {
      updateExercise(weId, { sets: exercise.sets });
      show(err instanceof ClientApiError ? err.message : "Unable to delete set.", { variant: "error" });
    }
  }

  async function handleAddExercise(newExercise: Exercise) {
    setPickerOpen(false);
    try {
      const { workoutExercise, previous } = await apiSend<{
        workoutExercise: { id: string; notes: string | null; sets: SetInput[] };
        previous: { date: string; sets: { weightKg: number; reps: number }[] } | null;
      }>(`/api/workouts/${workout.id}/exercises`, "POST", { exerciseId: newExercise.id });

      setExercises((prev) => [
        ...prev,
        {
          weId: workoutExercise.id,
          exerciseId: newExercise.id,
          exerciseName: newExercise.name,
          notes: workoutExercise.notes ?? "",
          completed: false,
          sets: workoutExercise.sets.map((s) => toSetRow(s, units)),
        },
      ]);
      setPreviousMap((prev) => ({ ...prev, [newExercise.id]: previous }));
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to add exercise.", { variant: "error" });
    }
  }

  async function confirmRemoveExercise() {
    if (!deleteExerciseId) return;
    const weId = deleteExerciseId;
    setDeleteExerciseId(null);
    const removed = exercises.find((e) => e.weId === weId);
    setExercises((prev) => prev.filter((e) => e.weId !== weId));
    try {
      await apiSend(`/api/workouts/${workout.id}/exercises/${weId}`, "DELETE");
    } catch (err) {
      if (removed) setExercises((prev) => [...prev, removed]);
      show(err instanceof ClientApiError ? err.message : "Unable to remove exercise.", {
        variant: "error",
      });
    }
  }

  async function handleMoveExercise(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;
    const next = [...exercises];
    [next[index], next[target]] = [next[target], next[index]];
    setExercises(next);
    try {
      await Promise.all([
        apiSend(`/api/workouts/${workout.id}/exercises/${next[index].weId}`, "PATCH", { order: index }),
        apiSend(`/api/workouts/${workout.id}/exercises/${next[target].weId}`, "PATCH", { order: target }),
      ]);
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to reorder exercises.", {
        variant: "error",
      });
    }
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      const { summary: result } = await apiSend<{ summary: WorkoutSummary }>(
        `/api/workouts/${workout.id}`,
        "PATCH",
        { finish: true }
      );
      setFinishedAt(new Date().toISOString());
      setSummary(result);
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to finish workout.", { variant: "error" });
    } finally {
      setFinishing(false);
    }
  }

  async function handleCompleteExercise(weId: string) {
    const exercise = exercises.find((e) => e.weId === weId);
    if (!exercise || exercise.completed) return;
    setCompletingId(weId);
    try {
      const setsToComplete = exercise.sets.filter((s) => !s.completed && s.reps !== "");
      await Promise.all(setsToComplete.map((s) => handleSetChange(weId, s.id, { completed: true })));
      await apiSend(`/api/workouts/${workout.id}/exercises/${weId}`, "PATCH", { completed: true });
      setExercises((prev) => prev.map((e) => (e.weId === weId ? { ...e, completed: true } : e)));

      const remaining = exercises.filter((e) => e.weId !== weId && !e.completed);
      if (remaining.length === 0) {
        await handleFinish();
      } else {
        const nextWeId = remaining[0].weId;
        requestAnimationFrame(() => {
          exerciseRefs.current.get(nextWeId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to complete exercise.", {
        variant: "error",
      });
    } finally {
      setCompletingId(null);
    }
  }

  async function handleReopenExercise(weId: string) {
    setExercises((prev) => prev.map((e) => (e.weId === weId ? { ...e, completed: false } : e)));
    try {
      await apiSend(`/api/workouts/${workout.id}/exercises/${weId}`, "PATCH", { completed: false });
    } catch (err) {
      setExercises((prev) => prev.map((e) => (e.weId === weId ? { ...e, completed: true } : e)));
      show(err instanceof ClientApiError ? err.message : "Unable to reopen exercise.", {
        variant: "error",
      });
    }
  }

  async function confirmDeleteWorkout() {
    setDeleteWorkoutOpen(false);
    try {
      await apiSend(`/api/workouts/${workout.id}`, "DELETE");
      router.push("/lifting/history");
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to delete workout.", {
        variant: "error",
      });
    }
  }

  return (
    <div>
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-app/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
          <button
            onClick={() => router.push(finishedAt ? "/lifting/history" : "/lifting")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => saveWorkoutMeta({ name })}
              className="w-full truncate bg-transparent text-lg font-semibold text-ink focus:outline-none"
            />
            <p className="text-strength-muted text-xs font-medium">{formatDuration(durationMs)}</p>
          </div>
          {finishedAt ? (
            <button
              onClick={() => setDeleteWorkoutOpen(true)}
              aria-label="Delete workout"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : (
            <Button size="sm" onClick={handleFinish} disabled={finishing}>
              <Check className="h-4 w-4" /> {finishing ? "Finishing..." : "Finish"}
            </Button>
          )}
        </div>
      </header>

      <div className="space-y-4 px-5 py-5">
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
        >
          <NotebookPen className="h-4 w-4" /> Workout notes
        </button>
        {notesOpen && (
          <Textarea
            placeholder="e.g. felt strong today"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => saveWorkoutMeta({ notes: notes || null })}
          />
        )}

        {!finishedAt && <RestTimerBar />}

        {(() => {
          const incompleteCount = exercises.filter((e) => !e.completed).length;
          const firstIncompleteWeId = exercises.find((e) => !e.completed)?.weId;
          return exercises.map((ex, index) => (
            <div
              key={ex.weId}
              ref={(el) => {
                if (el) exerciseRefs.current.set(ex.weId, el);
                else exerciseRefs.current.delete(ex.weId);
              }}
            >
              <ExerciseCard
                exerciseId={ex.exerciseId}
                exerciseName={ex.exerciseName}
                notes={ex.notes}
                sets={ex.sets}
                previousSets={previousMap[ex.exerciseId]?.sets ?? null}
                units={units}
                canReorder={exercises.length > 1}
                isFirst={index === 0}
                isLast={index === exercises.length - 1}
                completed={ex.completed}
                workoutFinished={!!finishedAt}
                isLastIncomplete={!ex.completed && incompleteCount === 1}
                isCurrent={ex.weId === firstIncompleteWeId}
                completing={completingId === ex.weId}
                onSetChange={(setId, patch) => handleSetChange(ex.weId, setId, patch)}
                onSetDelete={(setId) => handleDeleteSet(ex.weId, setId)}
                onAddSet={() => handleAddSet(ex.weId)}
                onRemoveExercise={() => setDeleteExerciseId(ex.weId)}
                onNotesChange={(value) => {
                  updateExercise(ex.weId, { notes: value });
                }}
                onNotesBlur={() => handleExerciseNotesBlur(ex.weId)}
                onMove={(direction) => handleMoveExercise(index, direction)}
                onComplete={() => handleCompleteExercise(ex.weId)}
                onReopen={() => handleReopenExercise(ex.weId)}
              />
            </div>
          ));
        })()}

        <button
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border-strong py-3.5 text-sm font-semibold text-ink-secondary hover:text-ink"
        >
          <Plus className="h-4 w-4" /> Add Exercise
        </button>
      </div>

      <ExercisePickerSheet
        open={pickerOpen}
        exercises={availableExercises}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
      />

      <ConfirmDialog
        open={!!deleteExerciseId}
        title="Remove exercise?"
        description="This exercise and its sets will be removed from this workout."
        confirmLabel="Remove"
        onConfirm={confirmRemoveExercise}
        onCancel={() => setDeleteExerciseId(null)}
      />

      <ConfirmDialog
        open={deleteWorkoutOpen}
        title="Delete workout?"
        description="This workout and all of its sets will be permanently removed."
        confirmLabel="Delete"
        onConfirm={confirmDeleteWorkout}
        onCancel={() => setDeleteWorkoutOpen(false)}
      />

      <FinishSummarySheet
        summary={summary}
        units={units}
        onClose={() => {
          setSummary(null);
          router.push("/lifting/history");
        }}
      />
    </div>
  );
}
