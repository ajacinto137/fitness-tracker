import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WeightScreen } from "@/components/weight/WeightScreen";

export default async function WeightPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [entries, settings] = await Promise.all([
    prisma.bodyWeightEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
  ]);

  const initialEntries = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    weightKg: e.weightKg,
    note: e.note,
  }));

  return <WeightScreen initialEntries={initialEntries} units={settings.units} />;
}
