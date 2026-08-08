import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { detectAndRecordPersonalRecords } from "@/lib/workout-service";
import { getWorkoutDetail } from "@/lib/workout-detail";
import { totalVolume } from "@/lib/calculations";

async function assertOwnership(userId: string, id: string) {
  const workout = await prisma.workout.findUnique({ where: { id } });
  if (!workout || workout.userId !== userId) {
    throw new ApiError(404, "Workout not found.");
  }
  return workout;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const detail = await getWorkoutDetail(userId, id);
    if (!detail) throw new ApiError(404, "Workout not found.");
    return NextResponse.json(detail);
  });
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  finish: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const existing = await assertOwnership(userId, id);

    const body = await req.json();
    const data = updateSchema.parse(body);

    const shouldFinish = data.finish && !existing.finishedAt;

    await prisma.workout.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(shouldFinish ? { finishedAt: new Date() } : {}),
      },
    });

    if (!shouldFinish) {
      const workout = await prisma.workout.findUnique({ where: { id } });
      return NextResponse.json({ workout });
    }

    const newRecords = await detectAndRecordPersonalRecords(userId, id);

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: { exercises: { include: { sets: true } } },
    });
    if (!workout) throw new ApiError(404, "Workout not found.");

    const allSets = workout.exercises.flatMap((e) => e.sets);
    const completedSets = allSets.filter((s) => s.completed);
    const durationMs = workout.finishedAt
      ? workout.finishedAt.getTime() - workout.startedAt.getTime()
      : 0;

    return NextResponse.json({
      workout,
      summary: {
        durationMs,
        exercisesCompleted: workout.exercises.filter((e) => e.sets.some((s) => s.completed)).length,
        totalSets: completedSets.length,
        totalVolumeKg: totalVolume(completedSets),
        newRecords,
      },
    });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);
    await prisma.workout.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
