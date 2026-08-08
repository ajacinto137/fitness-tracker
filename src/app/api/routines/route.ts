import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { routineSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const routines = await prisma.workoutRoutine.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: true },
        },
      },
    });
    return NextResponse.json({ routines });
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const data = routineSchema.parse(body);

    const exerciseIds = data.exercises.map((e) => e.exerciseId);
    if (exerciseIds.length > 0) {
      const owned = await prisma.exercise.count({
        where: { id: { in: exerciseIds }, userId },
      });
      if (owned !== new Set(exerciseIds).size) {
        throw new ApiError(400, "One or more exercises are invalid.");
      }
    }

    const routine = await prisma.workoutRoutine.create({
      data: {
        userId,
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
    return NextResponse.json({ routine }, { status: 201 });
  });
}
