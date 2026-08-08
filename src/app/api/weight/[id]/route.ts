import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling, ApiError } from "@/lib/api";
import { bodyWeightEntrySchema } from "@/lib/validation";
import { toKg } from "@/lib/units";
import { dateOnlyToUTCDate } from "@/lib/date";

async function assertOwnership(userId: string, id: string) {
  const entry = await prisma.bodyWeightEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) {
    throw new ApiError(404, "Weight entry not found.");
  }
  return entry;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);

    const body = await req.json();
    const data = bodyWeightEntrySchema.parse(body);
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const entry = await prisma.bodyWeightEntry.update({
      where: { id },
      data: {
        weightKg: toKg(data.weight, settings.units),
        date: dateOnlyToUTCDate(data.date),
        note: data.note || null,
      },
    });
    return NextResponse.json({ entry });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await assertOwnership(userId, id);
    await prisma.bodyWeightEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
