import { prisma } from "@/lib/prisma";
import { computeWorkoutSummary, getPreviousExercisePerformance, getWorkoutRecords } from "@/lib/workout-service";

export async function getWorkoutDetail(userId: string, workoutId: string) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
      },
    },
  });
  if (!workout) return null;

  const previousByExercise: Record<
    string,
    {
      date: Date;
      sets: { weightKg: number; reps: number; weightKgRight: number | null; repsRight: number | null }[];
    } | null
  > = {};

  for (const we of workout.exercises) {
    if (!(we.exerciseId in previousByExercise)) {
      const previous = await getPreviousExercisePerformance(userId, we.exerciseId, workoutId);
      previousByExercise[we.exerciseId] = previous
        ? {
            date: previous.date,
            sets: previous.sets.map((s) => ({
              weightKg: s.weightKg,
              reps: s.reps,
              weightKgRight: s.weightKgRight,
              repsRight: s.repsRight,
            })),
          }
        : null;
    }
  }

  const summary = workout.finishedAt
    ? computeWorkoutSummary(workout, await getWorkoutRecords(userId, workoutId))
    : null;

  return { workout, previousByExercise, summary };
}
