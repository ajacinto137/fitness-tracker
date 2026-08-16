import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { getPreviousExercisePerformance } from "@/lib/workout-service";

const addExerciseSchema = z.object({
  exerciseId: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id: workoutId } = await params;

    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { exercises: true },
    });
    if (!workout || workout.userId !== userId) {
      throw new ApiError(404, "Workout not found.");
    }

    const body = await req.json();
    const data = addExerciseSchema.parse(body);

    const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
    if (!exercise || exercise.userId !== userId) {
      throw new ApiError(404, "Exercise not found.");
    }

    const nextOrder = workout.exercises.length;
    const previous = await getPreviousExercisePerformance(userId, data.exerciseId, workoutId);

    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId: data.exerciseId,
        order: nextOrder,
        sets: {
          create: [
            {
              setNumber: 1,
              weightKg: previous?.sets[0]?.weightKg ?? 0,
              reps: previous?.sets[0]?.reps ?? 0,
              weightKgRight: previous?.sets[0]?.weightKgRight ?? 0,
              repsRight: previous?.sets[0]?.repsRight ?? 0,
              completed: false,
            },
          ],
        },
      },
      include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
    });

    return NextResponse.json(
      {
        workoutExercise,
        previous: previous
          ? {
              date: previous.date,
              sets: previous.sets.map((s) => ({
                weightKg: s.weightKg,
                reps: s.reps,
                weightKgRight: s.weightKgRight,
                repsRight: s.repsRight,
              })),
            }
          : null,
      },
      { status: 201 }
    );
  });
}
