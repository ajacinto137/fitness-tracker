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
            category="strength"
            title="No workouts yet"
            description="Start your first workout to begin tracking your progress."
          />
        ) : (
          workouts.map((w) => {
            const durationMs = new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime();
            return (
              <Link key={w.id} href={`/lifting/workout/${w.id}`}>
                <Card className="flex items-center justify-between py-3.5 transition-colors hover:bg-surface-hover">
                  <div className="min-w-0">
                    <p className="text-strength-soft truncate font-medium">{w.name}</p>
                    <p className="text-sm">
                      <span className="text-strength-muted">
                        {displayDate(w.startedAt, { year: "numeric" })} · {formatDurationShort(durationMs)}
                      </span>
                      <span className="text-ink-muted"> · </span>
                      <span className="text-accent-muted">{w.exerciseCount} exercises</span>
                    </p>
                  </div>
                  <ChevronRight className="text-strength-muted h-4 w-4 shrink-0" />
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
