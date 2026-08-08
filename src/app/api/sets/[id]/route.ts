import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { setSchema } from "@/lib/validation";
import { toKg } from "@/lib/units";
import { estimateOneRepMax } from "@/lib/calculations";

async function loadOwnedSet(userId: string, id: string) {
  const set = await prisma.workoutSet.findUnique({
    where: { id },
    include: { workoutExercise: { include: { workout: true, exercise: true } } },
  });
  if (!set || set.workoutExercise.workout.userId !== userId) {
    throw new ApiError(404, "Set not found.");
  }
  return set;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const existing = await loadOwnedSet(userId, id);

    const body = await req.json();
    const data = setSchema.partial().parse(body);
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const set = await prisma.workoutSet.update({
      where: { id },
      data: {
        ...(data.weight !== undefined ? { weightKg: toKg(data.weight, settings.units) } : {}),
        ...(data.reps !== undefined ? { reps: data.reps } : {}),
        ...(data.completed !== undefined ? { completed: data.completed } : {}),
      },
    });

    let newPR: { type: "HEAVIEST_WEIGHT" | "ESTIMATED_1RM"; value: number; reps: number } | null =
      null;

    if (set.completed && set.weightKg > 0) {
      const exerciseId = existing.workoutExercise.exerciseId;

      const bestWeight = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId, type: "HEAVIEST_WEIGHT" },
        orderBy: { value: "desc" },
      });
      if (!bestWeight || set.weightKg > bestWeight.value) {
        await prisma.personalRecord.create({
          data: {
            userId,
            exerciseId,
            type: "HEAVIEST_WEIGHT",
            value: set.weightKg,
            reps: set.reps,
            workoutId: existing.workoutExercise.workoutId,
          },
        });
        newPR = { type: "HEAVIEST_WEIGHT", value: set.weightKg, reps: set.reps };
      }

      const oneRm = estimateOneRepMax(set.weightKg, set.reps);
      const bestOneRm = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId, type: "ESTIMATED_1RM" },
        orderBy: { value: "desc" },
      });
      if (!newPR && (!bestOneRm || oneRm > bestOneRm.value)) {
        await prisma.personalRecord.create({
          data: {
            userId,
            exerciseId,
            type: "ESTIMATED_1RM",
            value: oneRm,
            workoutId: existing.workoutExercise.workoutId,
          },
        });
        newPR = { type: "ESTIMATED_1RM", value: oneRm, reps: set.reps };
      }
    }

    return NextResponse.json({
      set,
      newPR: newPR
        ? { ...newPR, exerciseName: existing.workoutExercise.exercise.name }
        : null,
    });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await loadOwnedSet(userId, id);
    await prisma.workoutSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
