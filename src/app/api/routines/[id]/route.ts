import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { routineSchema } from "@/lib/validation";

async function assertOwnership(userId: string, id: string) {
  const routine = await prisma.workoutRoutine.findUnique({ where: { id } });
  if (!routine || routine.userId !== userId) {
    throw new ApiError(404, "Routine not found.");
  }
  return routine;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);
    const routine = await prisma.workoutRoutine.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
    });
    return NextResponse.json({ routine });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);

    const body = await req.json();
    const data = routineSchema.parse(body);

    const exerciseIds = data.exercises.map((e) => e.exerciseId);
    if (exerciseIds.length > 0) {
      const owned = await prisma.exercise.count({ where: { id: { in: exerciseIds }, userId } });
      if (owned !== new Set(exerciseIds).size) {
        throw new ApiError(400, "One or more exercises are invalid.");
      }
    }

    const routine = await prisma.$transaction(async (tx) => {
      await tx.workoutRoutineExercise.deleteMany({ where: { routineId: id } });
      return tx.workoutRoutine.update({
        where: { id },
        data: {
          name: data.name,
          exercises: {
            create: data.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              order: e.order,
              targetSets: e.targetSets ?? null,
              targetReps: e.targetReps ?? null,
            })),
          },
        },
        include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
      });
    });

    return NextResponse.json({ routine });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);
    await prisma.workoutRoutine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
