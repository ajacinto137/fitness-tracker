import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { getUserSettings } from "@/lib/settings";
import { WeightScreen } from "@/components/weight/WeightScreen";

export default async function WeightPage() {
  const userId = await requireSessionUserId();

  const [entries, settings] = await Promise.all([
    prisma.bodyWeightEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    getUserSettings(userId),
  ]);

  const initialEntries = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    weightKg: e.weightKg,
    note: e.note,
  }));

  return <WeightScreen initialEntries={initialEntries} units={settings.units} />;
}
