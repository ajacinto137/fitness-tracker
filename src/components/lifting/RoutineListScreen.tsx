"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ListChecks } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";

type RoutineWithExercises = Prisma.WorkoutRoutineGetPayload<{
  include: { exercises: { include: { exercise: true } } };
}>;

export function RoutineListScreen({ initialRoutines }: { initialRoutines: RoutineWithExercises[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [routines, setRoutines] = useState(initialRoutines);
  const [deleting, setDeleting] = useState<RoutineWithExercises | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    const removed = deleting;
    setRoutines((prev) => prev.filter((r) => r.id !== removed.id));
    setDeleting(null);
    try {
      await apiSend(`/api/routines/${removed.id}`, "DELETE");
      show("Routine deleted");
    } catch (err) {
      setRoutines((prev) => [removed, ...prev]);
      show(err instanceof ClientApiError ? err.message : "Unable to delete routine.", {
        variant: "error",
      });
    }
  }

  return (
    <div>
      <SubPageHeader
        title="Routines"
        fallbackHref="/lifting"
        right={
          <button
            onClick={() => router.push("/lifting/routines/new")}
            aria-label="New routine"
            className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-full text-accent-ink"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-2 px-5 py-5">
        {routines.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            category="strength"
            title="No routines yet"
            description="Create a routine to make starting workouts faster."
            action={
              <Link
                href="/lifting/routines/new"
                className="bg-gradient-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-accent-ink"
              >
                Create Routine
              </Link>
            }
          />
        ) : (
          routines.map((routine) => (
            <Link key={routine.id} href={`/lifting/routines/${routine.id}`}>
              <Card className="transition-colors hover:bg-surface-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-strength-soft font-semibold">{routine.name}</p>
                    <p className="text-strength-muted mt-1 truncate text-sm">
                      {routine.exercises.length === 0
                        ? "No exercises yet"
                        : routine.exercises.map((re) => re.exercise.name).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleting(routine);
                    }}
                    aria-label="Delete routine"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete routine?"
        description={`"${deleting?.name}" will be permanently removed. Past workouts started from it are not affected.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
