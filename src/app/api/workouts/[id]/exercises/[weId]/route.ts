import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";

async function assertOwnership(userId: string, workoutId: string, weId: string) {
  const we = await prisma.workoutExercise.findUnique({
    where: { id: weId },
    include: { workout: true },
  });
  if (!we || we.workoutId !== workoutId || we.workout.userId !== userId) {
    throw new ApiError(404, "Exercise entry not found in this workout.");
  }
  return we;
}

const updateSchema = z.object({
  notes: z.string().trim().max(1000).optional().nullable(),
  order: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; weId: string }> }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id: workoutId, weId } = await params;
    await assertOwnership(userId, workoutId, weId);

    const body = await req.json();
    const data = updateSchema.parse(body);

    const workoutExercise = await prisma.workoutExercise.update({
      where: { id: weId },
      data,
      include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
    });
    return NextResponse.json({ workoutExercise });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; weId: string }> }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id: workoutId, weId } = await params;
    await assertOwnership(userId, workoutId, weId);
    await prisma.workoutExercise.delete({ where: { id: weId } });
    return NextResponse.json({ success: true });
  });
}
