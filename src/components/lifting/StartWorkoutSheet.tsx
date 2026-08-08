"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";

type RoutineWithExercises = Prisma.WorkoutRoutineGetPayload<{
  include: { exercises: { include: { exercise: true } } };
}>;

interface Workout {
  id: string;
}

export function StartWorkoutSheet({
  open,
  routines,
  onClose,
}: {
  open: boolean;
  routines: RoutineWithExercises[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [startingId, setStartingId] = useState<string | null>(null);

  async function start(routineId?: string) {
    setStartingId(routineId ?? "empty");
    try {
      const { workout } = await apiSend<{ workout: Workout }>("/api/workouts", "POST", {
        routineId,
      });
      router.push(`/lifting/workout/${workout.id}`);
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to start workout.", {
        variant: "error",
      });
      setStartingId(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Start Workout">
      <div className="space-y-4">
        <Button size="lg" fullWidth disabled={!!startingId} onClick={() => start(undefined)}>
          {startingId === "empty" ? "Starting..." : "Start Empty Workout"}
        </Button>

        {routines.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-sm font-medium text-ink-secondary">Or choose a routine</p>
            {routines.map((routine) => (
              <button
                key={routine.id}
                disabled={!!startingId}
                onClick={() => start(routine.id)}
                className="flex w-full items-center justify-between rounded-xl border border-border-strong bg-surface px-4 py-3 text-left hover:bg-surface-hover disabled:opacity-60"
              >
                <div>
                  <p className="font-medium text-ink">{routine.name}</p>
                  <p className="text-sm text-ink-secondary">{routine.exercises.length} exercises</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
