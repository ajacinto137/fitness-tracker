import { prisma } from "@/lib/prisma";
import { bestEstimatedOneRepMax, heaviestSet, totalVolume } from "@/lib/calculations";

export async function getExerciseDetail(userId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findFirst({ where: { id: exerciseId, userId } });
  if (!exercise) return null;

  const workoutExercises = await prisma.workoutExercise.findMany({
    where: {
      exerciseId,
      workout: { userId, finishedAt: { not: null } },
    },
    include: { sets: true, workout: true },
    orderBy: { workout: { startedAt: "asc" } },
  });

  const history = workoutExercises.map((we) => {
    const completed = we.sets.filter((s) => s.completed);
    const heaviest = heaviestSet(completed);
    return {
      workoutId: we.workoutId,
      date: we.workout.startedAt,
      heaviestWeightKg: heaviest?.weightKg ?? 0,
      heaviestReps: heaviest?.reps ?? 0,
      estimatedOneRepMaxKg: bestEstimatedOneRepMax(completed),
      volumeKg: totalVolume(completed),
    };
  });

  const personalRecords = await prisma.personalRecord.findMany({
    where: { userId, exerciseId },
    orderBy: { value: "desc" },
  });

  const lastPerformed = history.length > 0 ? history[history.length - 1].date : null;
  const currentBestWeightKg = history.reduce((max, h) => Math.max(max, h.heaviestWeightKg), 0);
  const currentBestOneRepMaxKg = history.reduce((max, h) => Math.max(max, h.estimatedOneRepMaxKg), 0);
  const recentVolumeKg = history.length > 0 ? history[history.length - 1].volumeKg : 0;

  return {
    exercise,
    history,
    personalRecords,
    summary: { lastPerformed, currentBestWeightKg, currentBestOneRepMaxKg, recentVolumeKg },
  };
}
