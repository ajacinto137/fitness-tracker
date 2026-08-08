import { prisma } from "@/lib/prisma";
import {
  bestEstimatedOneRepMax,
  estimateOneRepMax,
  heaviestSet,
  totalVolume,
} from "@/lib/calculations";

/**
 * Sets from the most recent previous workout in which this exercise was performed,
 * used to prepopulate new sets and to show "Previous" performance in the active
 * workout screen.
 */
export async function getPreviousExercisePerformance(
  userId: string,
  exerciseId: string,
  excludeWorkoutId?: string
) {
  const lastWorkoutExercise = await prisma.workoutExercise.findFirst({
    where: {
      exerciseId,
      workout: {
        userId,
        finishedAt: { not: null },
        ...(excludeWorkoutId ? { id: { not: excludeWorkoutId } } : {}),
      },
    },
    orderBy: { workout: { startedAt: "desc" } },
    include: { sets: { orderBy: { setNumber: "asc" } }, workout: true },
  });

  if (!lastWorkoutExercise) return null;

  return {
    workoutId: lastWorkoutExercise.workoutId,
    date: lastWorkoutExercise.workout.startedAt,
    sets: lastWorkoutExercise.sets,
  };
}

/**
 * Compares completed sets in a finished workout against stored personal records
 * and creates new PersonalRecord rows where the user has set a new best.
 * Returns the newly achieved records for display in the finish-workout summary.
 */
export async function detectAndRecordPersonalRecords(userId: string, workoutId: string) {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        include: { exercise: true, sets: true },
      },
    },
  });
  if (!workout) return [];

  const newRecords: {
    exerciseName: string;
    type: "HEAVIEST_WEIGHT" | "ESTIMATED_1RM" | "WORKOUT_VOLUME";
    value: number;
    reps?: number;
  }[] = [];

  for (const we of workout.exercises) {
    const completedSets = we.sets.filter((s) => s.completed && s.weightKg > 0);
    if (completedSets.length === 0) continue;

    const heaviest = heaviestSet(completedSets);
    if (heaviest) {
      const currentBest = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId: we.exerciseId, type: "HEAVIEST_WEIGHT" },
        orderBy: { value: "desc" },
      });
      if (!currentBest || heaviest.weightKg > currentBest.value) {
        await prisma.personalRecord.create({
          data: {
            userId,
            exerciseId: we.exerciseId,
            type: "HEAVIEST_WEIGHT",
            value: heaviest.weightKg,
            reps: heaviest.reps,
            workoutId,
          },
        });
        newRecords.push({
          exerciseName: we.exercise.name,
          type: "HEAVIEST_WEIGHT",
          value: heaviest.weightKg,
          reps: heaviest.reps,
        });
      }
    }

    const bestOneRm = bestEstimatedOneRepMax(completedSets);
    if (bestOneRm > 0) {
      const currentBestOneRm = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId: we.exerciseId, type: "ESTIMATED_1RM" },
        orderBy: { value: "desc" },
      });
      if (!currentBestOneRm || bestOneRm > currentBestOneRm.value) {
        await prisma.personalRecord.create({
          data: {
            userId,
            exerciseId: we.exerciseId,
            type: "ESTIMATED_1RM",
            value: bestOneRm,
            workoutId,
          },
        });
        newRecords.push({ exerciseName: we.exercise.name, type: "ESTIMATED_1RM", value: bestOneRm });
      }
    }
  }

  const allCompletedSets = workout.exercises.flatMap((we) => we.sets);
  const workoutVolume = totalVolume(allCompletedSets);
  if (workoutVolume > 0) {
    const currentBestVolume = await prisma.personalRecord.findFirst({
      where: { userId, exerciseId: null, type: "WORKOUT_VOLUME" },
      orderBy: { value: "desc" },
    });
    if (!currentBestVolume || workoutVolume > currentBestVolume.value) {
      await prisma.personalRecord.create({
        data: { userId, type: "WORKOUT_VOLUME", value: workoutVolume, workoutId },
      });
      newRecords.push({ exerciseName: "Overall Workout", type: "WORKOUT_VOLUME", value: workoutVolume });
    }
  }

  return newRecords;
}

export { estimateOneRepMax, totalVolume, heaviestSet };
