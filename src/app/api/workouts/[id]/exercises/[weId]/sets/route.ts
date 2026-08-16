import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; weId: string }> }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id: workoutId, weId } = await params;

    const we = await prisma.workoutExercise.findUnique({
      where: { id: weId },
      include: { workout: true, sets: { orderBy: { setNumber: "asc" } } },
    });
    if (!we || we.workoutId !== workoutId || we.workout.userId !== userId) {
      throw new ApiError(404, "Exercise entry not found in this workout.");
    }

    const lastSet = we.sets[we.sets.length - 1];
    const nextSetNumber = we.sets.reduce((max, s) => Math.max(max, s.setNumber), 0) + 1;
    const set = await prisma.workoutSet.create({
      data: {
        workoutExerciseId: weId,
        setNumber: nextSetNumber,
        weightKg: lastSet?.weightKg ?? 0,
        reps: lastSet?.reps ?? 0,
        weightKgRight: lastSet?.weightKgRight ?? 0,
        repsRight: lastSet?.repsRight ?? 0,
        completed: false,
      },
    });

    return NextResponse.json({ set }, { status: 201 });
  });
}
