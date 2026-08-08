import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling } from "@/lib/api";
import { unitsSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const [user, settings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
      prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: { userId },
      }),
    ]);
    return NextResponse.json({ user, settings });
  });
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  units: unitsSchema.optional(),
});

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const [user, settings] = await Promise.all([
      data.name
        ? prisma.user.update({ where: { id: userId }, data: { name: data.name } })
        : prisma.user.findUnique({ where: { id: userId } }),
      data.units
        ? prisma.userSettings.upsert({
            where: { userId },
            update: { units: data.units },
            create: { userId, units: data.units },
          })
        : prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
    ]);

    return NextResponse.json({
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      settings,
    });
  });
}
