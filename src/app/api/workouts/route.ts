import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { getPreviousExercisePerformance } from "@/lib/workout-service";

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

    const workouts = await prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        _count: { select: { exercises: true } },
        exercises: { select: { sets: { select: { id: true } } } },
      },
    });

    const result = workouts.map((w) => ({
      id: w.id,
      name: w.name,
      startedAt: w.startedAt,
      finishedAt: w.finishedAt,
      exerciseCount: w._count.exercises,
      setCount: w.exercises.reduce((sum, e) => sum + e.sets.length, 0),
    }));

    return NextResponse.json({ workouts: result });
  });
}

const startWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  routineId: z.string().optional().nullable(),
});

const DEFAULT_SET_COUNT = 3;

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const data = startWorkoutSchema.parse(body);

    if (data.routineId) {
      const routine = await prisma.workoutRoutine.findUnique({
        where: { id: data.routineId },
        include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
      });
      if (!routine || routine.userId !== userId) {
        throw new ApiError(404, "Routine not found.");
      }

      const workout = await prisma.workout.create({
        data: {
          userId,
          routineId: routine.id,
          name: data.name || routine.name,
        },
      });

      for (const re of routine.exercises) {
        const previous = await getPreviousExercisePerformance(userId, re.exerciseId);
        const setCount = re.targetSets ?? DEFAULT_SET_COUNT;

        const we = await prisma.workoutExercise.create({
          data: {
            workoutId: workout.id,
            exerciseId: re.exerciseId,
            order: re.order,
          },
        });

        for (let i = 0; i < setCount; i++) {
          const prevSet = previous?.sets[i];
          await prisma.workoutSet.create({
            data: {
              workoutExerciseId: we.id,
              setNumber: i + 1,
              weightKg: prevSet?.weightKg ?? 0,
              reps: prevSet?.reps ?? re.targetReps ?? 0,
              completed: false,
            },
          });
        }
      }

      const full = await prisma.workout.findUnique({
        where: { id: workout.id },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
          },
        },
      });
      return NextResponse.json({ workout: full }, { status: 201 });
    }

    const workout = await prisma.workout.create({
      data: { userId, name: data.name || "Workout" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
        },
      },
    });
    return NextResponse.json({ workout }, { status: 201 });
  });
}
