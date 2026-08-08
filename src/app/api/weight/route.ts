import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling } from "@/lib/api";
import { bodyWeightEntrySchema } from "@/lib/validation";
import { toKg } from "@/lib/units";
import { dateOnlyToUTCDate } from "@/lib/date";

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const [entries, settings] = await Promise.all([
      prisma.bodyWeightEntry.findMany({
        where: { userId },
        orderBy: { date: "asc" },
      }),
      prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
    ]);
    return NextResponse.json({ entries, units: settings.units });
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const data = bodyWeightEntrySchema.parse(body);
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const entry = await prisma.bodyWeightEntry.create({
      data: {
        userId,
        weightKg: toKg(data.weight, settings.units),
        date: dateOnlyToUTCDate(data.date),
        note: data.note || null,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  });
}
