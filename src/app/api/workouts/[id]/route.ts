import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { computeWorkoutSummary, detectAndRecordPersonalRecords } from "@/lib/workout-service";
import { getWorkoutDetail } from "@/lib/workout-detail";

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
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const existing = await assertOwnership(userId, id);

    const body = await req.json();
    const data = updateSchema.parse(body);

    const shouldFinish = data.finish && !existing.finishedAt;

    if (data.finishedAt !== undefined && !existing.finishedAt && !shouldFinish) {
      throw new ApiError(400, "Finish the workout before editing its finish time.");
    }

    const nextStartedAt = data.startedAt ? new Date(data.startedAt) : existing.startedAt;
    const nextFinishedAt = shouldFinish
      ? new Date()
      : data.finishedAt !== undefined
        ? new Date(data.finishedAt)
        : existing.finishedAt;

    if (nextFinishedAt && nextStartedAt > nextFinishedAt) {
      throw new ApiError(400, "Start time must be before finish time.");
    }
    if (nextStartedAt.getTime() > Date.now()) {
      throw new ApiError(400, "Start time can't be in the future.");
    }

    await prisma.workout.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.startedAt !== undefined ? { startedAt: nextStartedAt } : {}),
        ...(shouldFinish || data.finishedAt !== undefined ? { finishedAt: nextFinishedAt } : {}),
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

    return NextResponse.json({
      workout,
      summary: computeWorkoutSummary(workout, newRecords),
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
