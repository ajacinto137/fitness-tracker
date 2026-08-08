"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Exercise } from "@prisma/client";
import { Sheet } from "@/components/ui/Sheet";
import { MUSCLE_GROUP_LABELS } from "@/lib/muscle-groups";

interface ExercisePickerSheetProps {
  open: boolean;
  exercises: Exercise[];
  excludeIds?: string[];
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePickerSheet({
  open,
  exercises,
  excludeIds = [],
  onClose,
  onSelect,
}: ExercisePickerSheetProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (excludeIds.includes(e.id)) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [exercises, excludeIds, search]);

  return (
    <Sheet open={open} onClose={onClose} title="Add Exercise">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises"
          autoFocus
          className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 pl-10 text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-wash"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">
          {exercises.length === 0 ? "Add exercises to your library first." : "No exercises match."}
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                onSelect(ex);
                setSearch("");
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-surface"
            >
              <span className="font-medium text-ink">{ex.name}</span>
              <span className="text-xs text-ink-muted">{MUSCLE_GROUP_LABELS[ex.muscleGroup]}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
