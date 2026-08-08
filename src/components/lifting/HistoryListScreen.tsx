"use client";

import Link from "next/link";
import { History, ChevronRight } from "lucide-react";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { displayDate } from "@/lib/date";
import { formatDurationShort } from "@/lib/duration";

interface HistoryWorkout {
  id: string;
  name: string;
  startedAt: string;
  finishedAt: string;
  exerciseCount: number;
}

export function HistoryListScreen({ workouts }: { workouts: HistoryWorkout[] }) {
  return (
    <div>
      <SubPageHeader title="Workout History" fallbackHref="/lifting" />
      <div className="space-y-2 px-5 py-5">
        {workouts.length === 0 ? (
          <EmptyState
            icon={History}
            title="No workouts yet"
            description="Start your first workout to begin tracking your progress."
          />
        ) : (
          workouts.map((w) => {
            const durationMs = new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime();
            return (
              <Link key={w.id} href={`/lifting/workout/${w.id}`}>
                <Card className="flex items-center justify-between py-3.5 hover:bg-surface-hover">
                  <div>
                    <p className="font-medium text-ink">{w.name}</p>
                    <p className="text-sm text-ink-secondary">
                      {displayDate(w.startedAt, { year: "numeric" })} · {formatDurationShort(durationMs)} ·{" "}
                      {w.exerciseCount} exercises
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
