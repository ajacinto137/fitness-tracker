"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ChevronRight, Trophy, Plus } from "lucide-react";
import type { Exercise, PersonalRecordType, Prisma, Workout } from "@prisma/client";
import { TopBar } from "@/components/nav/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconContainer } from "@/components/ui/IconContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StartWorkoutSheet } from "@/components/lifting/StartWorkoutSheet";
import { ExerciseFormSheet, type ExerciseFormValues } from "@/components/lifting/ExerciseFormSheet";
import { useToast } from "@/components/ui/Toast";
import { createExercise } from "@/lib/exercises-client";
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
  const { show } = useToast();
  const [startOpen, setStartOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreateExercise(values: ExerciseFormValues) {
    const exercise = await createExercise(values);
    show(`${exercise.name} added to your exercise library.`);
  }

  return (
    <div>
      <TopBar title="Lifting" />
      <div className="space-y-6 px-5 py-5">
        {activeWorkout ? (
          <Button
            size="lg"
            fullWidth
            gradient="strength"
            onClick={() => router.push(`/lifting/workout/${activeWorkout.id}`)}
          >
            <Play className="h-5 w-5" /> Continue Workout
          </Button>
        ) : (
          <Button size="lg" fullWidth gradient="strength" onClick={() => setStartOpen(true)}>
            <Play className="h-5 w-5" /> Start Workout
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="py-3">
            <p className="text-xs font-medium text-ink-muted">This Week</p>
            <p className="mt-0.5 truncate text-lg font-semibold">
              <span className="text-gradient-strength">{workoutsThisWeek}</span>{" "}
              <span className="text-ink">workout{workoutsThisWeek === 1 ? "" : "s"}</span>
            </p>
          </Card>
          <Card className="py-3">
            <p className="text-xs font-medium text-ink-muted">Last Workout</p>
            <p className="text-strength-soft mt-0.5 truncate text-lg font-semibold">
              {recentWorkouts[0] ? displayDate(recentWorkouts[0].startedAt) : "—"}
            </p>
          </Card>
        </div>

        {recentPR && (
          <Card accent="achievement" className="flex items-center gap-3">
            <IconContainer icon={Trophy} category="achievement" size="sm" />
            <p className="min-w-0 text-sm text-ink">
              <span className="text-gold font-semibold">{recentPR.exerciseName}</span> — new{" "}
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
                  <Card className="flex items-center justify-between py-3 transition-colors hover:bg-surface-hover">
                    <div className="min-w-0">
                      <p className="text-strength-soft truncate font-medium">{w.name}</p>
                      <p className="text-sm">
                        <span className="text-strength-muted">{displayDate(w.startedAt)}</span>
                        <span className="text-ink-muted"> · </span>
                        <span className="text-accent-muted">{w.exerciseCount} exercises</span>
                      </p>
                    </div>
                    <ChevronRight className="text-strength-muted h-4 w-4 shrink-0" />
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
                  <Card className="flex items-center justify-between py-3 transition-colors hover:bg-surface-hover">
                    <div className="min-w-0">
                      <p className="text-strength-soft truncate font-medium">{r.name}</p>
                      <p className="text-accent-muted text-sm">{r.exercises.length} exercises</p>
                    </div>
                    <ChevronRight className="text-strength-muted h-4 w-4 shrink-0" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Recent Exercises"
          href="/lifting/exercises"
          action={
            <button
              onClick={() => setCreateOpen(true)}
              aria-label="Create exercise"
              className="bg-gradient-primary flex h-8 w-8 items-center justify-center rounded-full text-accent-ink"
            >
              <Plus className="h-4 w-4" />
            </button>
          }
        >
          {recentExercises.length === 0 ? (
            <p className="py-2 text-sm text-ink-muted">Your recently performed exercises will show here.</p>
          ) : (
            <div className="space-y-2">
              {recentExercises.map((ex) => (
                <Link key={ex.id} href={`/lifting/exercises/${ex.id}`}>
                  <Card className="flex items-center justify-between py-3 transition-colors hover:bg-surface-hover">
                    <p className="text-strength-soft truncate font-medium">{ex.name}</p>
                    <Badge>{MUSCLE_GROUP_LABELS[ex.muscleGroup]}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      <StartWorkoutSheet open={startOpen} routines={routines} onClose={() => setStartOpen(false)} />
      <ExerciseFormSheet open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreateExercise} />
    </div>
  );
}

function Section({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <SectionHeader title={title} href={href} category="strength" action={action} />
      {children}
    </section>
  );
}
