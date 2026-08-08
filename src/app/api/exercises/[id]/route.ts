import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { exerciseSchema } from "@/lib/validation";
import { getExerciseDetail } from "@/lib/exercise-detail";

async function assertOwnership(userId: string, id: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise || exercise.userId !== userId) {
    throw new ApiError(404, "Exercise not found.");
  }
  return exercise;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const detail = await getExerciseDetail(userId, id);
    if (!detail) throw new ApiError(404, "Exercise not found.");
    return NextResponse.json(detail);
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);

    const body = await req.json();
    const data = exerciseSchema.parse(body);

    const conflict = await prisma.exercise.findFirst({
      where: { userId, name: { equals: data.name, mode: "insensitive" }, id: { not: id } },
    });
    if (conflict) {
      throw new ApiError(409, "You already have an exercise with that name.");
    }

    const exercise = await prisma.exercise.update({ where: { id }, data });
    return NextResponse.json({ exercise });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);

    try {
      await prisma.exercise.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ApiError(
          409,
          "This exercise has workout history and can't be deleted, so your past data stays intact."
        );
      }
      throw err;
    }
    return NextResponse.json({ success: true });
  });
}
