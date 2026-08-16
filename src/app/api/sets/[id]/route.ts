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
        ...(data.weightRight !== undefined
          ? { weightKgRight: data.weightRight != null ? toKg(data.weightRight, settings.units) : null }
          : {}),
        ...(data.repsRight !== undefined ? { repsRight: data.repsRight } : {}),
        ...(data.completed !== undefined ? { completed: data.completed } : {}),
      },
    });

    let newPR: { type: "HEAVIEST_WEIGHT" | "ESTIMATED_1RM"; value: number; reps: number } | null =
      null;

    if (set.completed) {
      const exerciseId = existing.workoutExercise.exerciseId;
      // Unilateral sets carry an independent left/right side; each is
      // checked against PRs in turn (first side to set a record wins the
      // single newPR slot, matching the one-PR-per-edit toast contract).
      const sides = [{ weightKg: set.weightKg, reps: set.reps }];
      if (set.weightKgRight != null || set.repsRight != null) {
        sides.push({ weightKg: set.weightKgRight ?? 0, reps: set.repsRight ?? 0 });
      }

      for (const side of sides) {
        if (side.weightKg <= 0) continue;

        if (!newPR) {
          const bestWeight = await prisma.personalRecord.findFirst({
            where: { userId, exerciseId, type: "HEAVIEST_WEIGHT" },
            orderBy: { value: "desc" },
          });
          if (!bestWeight || side.weightKg > bestWeight.value) {
            await prisma.personalRecord.create({
              data: {
                userId,
                exerciseId,
                type: "HEAVIEST_WEIGHT",
                value: side.weightKg,
                reps: side.reps,
                workoutId: existing.workoutExercise.workoutId,
              },
            });
            newPR = { type: "HEAVIEST_WEIGHT", value: side.weightKg, reps: side.reps };
            continue;
          }
        }

        if (!newPR) {
          const oneRm = estimateOneRepMax(side.weightKg, side.reps);
          const bestOneRm = await prisma.personalRecord.findFirst({
            where: { userId, exerciseId, type: "ESTIMATED_1RM" },
            orderBy: { value: "desc" },
          });
          if (!bestOneRm || oneRm > bestOneRm.value) {
            await prisma.personalRecord.create({
              data: {
                userId,
                exerciseId,
                type: "ESTIMATED_1RM",
                value: oneRm,
                workoutId: existing.workoutExercise.workoutId,
              },
            });
            newPR = { type: "ESTIMATED_1RM", value: oneRm, reps: side.reps };
          }
        }
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
