import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getWorkoutDetail } from "@/lib/workout-detail";
import { ActiveWorkoutScreen } from "@/components/lifting/ActiveWorkoutScreen";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [detail, exercises, settings] = await Promise.all([
    getWorkoutDetail(userId, id),
    prisma.exercise.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
  ]);

  if (!detail) notFound();

  const previousByExercise: Record<string, { date: string; sets: { weightKg: number; reps: number }[] } | null> = {};
  for (const [exerciseId, value] of Object.entries(detail.previousByExercise)) {
    previousByExercise[exerciseId] = value ? { date: value.date.toISOString(), sets: value.sets } : null;
  }

  return (
    <ActiveWorkoutScreen
      workout={{
        id: detail.workout.id,
        name: detail.workout.name,
        notes: detail.workout.notes,
        startedAt: detail.workout.startedAt.toISOString(),
        finishedAt: detail.workout.finishedAt?.toISOString() ?? null,
        exercises: detail.workout.exercises.map((we) => ({
          id: we.id,
          order: we.order,
          notes: we.notes,
          exercise: { id: we.exercise.id, name: we.exercise.name },
          sets: we.sets.map((s) => ({
            id: s.id,
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            completed: s.completed,
          })),
        })),
      }}
      previousByExercise={previousByExercise}
      availableExercises={exercises}
      units={settings.units}
    />
  );
}
