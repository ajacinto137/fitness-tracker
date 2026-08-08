import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { exerciseSchema, muscleGroups } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const muscleGroup = url.searchParams.get("muscleGroup");

    const where: Prisma.ExerciseWhereInput = { userId };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (muscleGroup && (muscleGroups as readonly string[]).includes(muscleGroup)) {
      where.muscleGroup = muscleGroup as (typeof muscleGroups)[number];
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ exercises });
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const data = exerciseSchema.parse(body);

    const existing = await prisma.exercise.findFirst({
      where: { userId, name: { equals: data.name, mode: "insensitive" } },
    });
    if (existing) {
      throw new ApiError(409, "You already have an exercise with that name.");
    }

    const exercise = await prisma.exercise.create({
      data: { ...data, userId },
    });
    return NextResponse.json({ exercise }, { status: 201 });
  });
}
