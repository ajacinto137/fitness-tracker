"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ChevronRight, Dumbbell, ListChecks, Trophy } from "lucide-react";
import type { Exercise, PersonalRecordType, Prisma, Workout } from "@prisma/client";
import { TopBar } from "@/components/nav/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StartWorkoutSheet } from "@/components/lifting/StartWorkoutSheet";
import { displayDate } from "@/lib/date";
import { MUSCLE_GROUP_LABELS } from "@/lib/muscle-groups";

type RoutineWithExercises = Prisma.WorkoutRoutineGetPayload<{
  include: { exercises: { include: { exercise: true } } };
}>;

interface RecentWorkout {
  id: string;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  exerciseCount: number;
}

const PR_LABELS: Record<PersonalRecordType, string> = {
  HEAVIEST_WEIGHT: "heaviest weight",
  ESTIMATED_1RM: "estimated 1RM",
  WORKOUT_VOLUME: "workout volume",
};

export function LiftingDashboardScreen({
  activeWorkout,
  recentWorkouts,
  routines,
  recentExercises,
  workoutsThisWeek,
  recentPR,
}: {
  activeWorkout: Workout | null;
  recentWorkouts: RecentWorkout[];
  routines: RoutineWithExercises[];
  recentExercises: Exercise[];
  workoutsThisWeek: number;
  recentPR: { exerciseName: string; type: PersonalRecordType; value: number; achievedAt: string } | null;
}) {
  const router = useRouter();
  const [startOpen, setStartOpen] = useState(false);

  return (
    <div>
      <TopBar title="Lifting" />
      <div className="space-y-6 px-5 py-5">
        {activeWorkout ? (
          <Button size="lg" fullWidth onClick={() => router.push(`/lifting/workout/${activeWorkout.id}`)}>
            <Play className="h-5 w-5" /> Continue Workout
          </Button>
        ) : (
          <Button size="lg" fullWidth onClick={() => setStartOpen(true)}>
            <Play className="h-5 w-5" /> Start Workout
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="py-3">
            <p className="text-xs font-medium text-ink-muted">This Week</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {workoutsThisWeek} workout{workoutsThisWeek === 1 ? "" : "s"}
            </p>
          </Card>
          <Card className="py-3">
            <p className="text-xs font-medium text-ink-muted">Last Workout</p>
            <p className="mt-1 truncate text-lg font-semibold text-ink">
              {recentWorkouts[0] ? displayDate(recentWorkouts[0].startedAt) : "—"}
            </p>
          </Card>
        </div>

        {recentPR && (
          <Card className="flex items-center gap-3">
            <Trophy className="h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm text-ink">
              <span className="font-semibold">{recentPR.exerciseName}</span> — new{" "}
              {PR_LABELS[recentPR.type]} on {displayDate(recentPR.achievedAt)}
            </p>
          </Card>
        )}

        <Section title="Recent Workouts" href="/lifting/history">
          {recentWorkouts.length === 0 ? (
            <p className="py-2 text-sm text-ink-muted">
              Start your first workout to begin tracking your progress.
            </p>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <Link key={w.id} href={`/lifting/workout/${w.id}`}>
                  <Card className="flex items-center justify-between py-3 hover:bg-surface-hover">
                    <div>
                      <p className="font-medium text-ink">{w.name}</p>
                      <p className="text-sm text-ink-secondary">
                        {displayDate(w.startedAt)} · {w.exerciseCount} exercises
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-muted" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Workout Routines" href="/lifting/routines">
          {routines.length === 0 ? (
            <p className="py-2 text-sm text-ink-muted">
              Create a routine to make starting workouts faster.
            </p>
          ) : (
            <div className="space-y-2">
              {routines.slice(0, 4).map((r) => (
                <Link key={r.id} href={`/lifting/routines/${r.id}`}>
                  <Card className="flex items-center justify-between py-3 hover:bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <ListChecks className="h-4 w-4 text-ink-muted" />
                      <div>
                        <p className="font-medium text-ink">{r.name}</p>
                        <p className="text-sm text-ink-secondary">{r.exercises.length} exercises</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-muted" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Recent Exercises" href="/lifting/exercises">
          {recentExercises.length === 0 ? (
            <p className="py-2 text-sm text-ink-muted">Your recently performed exercises will show here.</p>
          ) : (
            <div className="space-y-2">
              {recentExercises.map((ex) => (
                <Link key={ex.id} href={`/lifting/exercises/${ex.id}`}>
                  <Card className="flex items-center justify-between py-3 hover:bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <Dumbbell className="h-4 w-4 text-ink-muted" />
                      <p className="font-medium text-ink">{ex.name}</p>
                    </div>
                    <span className="text-xs text-ink-muted">{MUSCLE_GROUP_LABELS[ex.muscleGroup]}</span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      <StartWorkoutSheet open={startOpen} routines={routines} onClose={() => setStartOpen(false)} />
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-ink">{title}</h2>
        <Link href={href} className="text-sm font-medium text-accent-soft">
          See all
        </Link>
      </div>
      {children}
    </section>
  );
}
