"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Dumbbell } from "lucide-react";
import type { Exercise, MuscleGroup } from "@prisma/client";
import { clsx } from "clsx";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExerciseFormSheet, type ExerciseFormValues } from "@/components/lifting/ExerciseFormSheet";
import { apiSend, ClientApiError } from "@/lib/client-fetch";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/lib/muscle-groups";

export function ExerciseLibraryScreen({ initialExercises }: { initialExercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MuscleGroup | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (filter && e.muscleGroup !== filter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [exercises, search, filter]);

  async function createExercise(values: ExerciseFormValues) {
    try {
      const { exercise } = await apiSend<{ exercise: Exercise }>("/api/exercises", "POST", values);
      setExercises((prev) => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      throw new Error(err instanceof ClientApiError ? err.message : "Unable to create exercise.");
    }
  }

  return (
    <div>
      <SubPageHeader
        title="Exercise Library"
        fallbackHref="/lifting"
        right={
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="New exercise"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-strong text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-4 px-5 py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises"
            className="h-11 w-full rounded-xl border border-border-strong bg-surface-2 pl-10 pr-4 text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash"
          />
        </div>

        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <FilterChip active={filter === null} onClick={() => setFilter(null)} label="All" />
          {MUSCLE_GROUPS.map((g) => (
            <FilterChip
              key={g}
              active={filter === g}
              onClick={() => setFilter(g)}
              label={MUSCLE_GROUP_LABELS[g]}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          exercises.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No exercises yet"
              description="Add your first exercise to start building routines and workouts."
            />
          ) : (
            <p className="py-8 text-center text-sm text-ink-muted">No exercises match your search.</p>
          )
        ) : (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <Link key={ex.id} href={`/lifting/exercises/${ex.id}`}>
                <Card className="flex items-center justify-between py-3.5 transition-colors hover:bg-surface-hover">
                  <span className="font-medium text-ink">{ex.name}</span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-secondary">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ExerciseFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSubmit={createExercise} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent-strong text-white" : "bg-surface-2 text-ink-secondary hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
