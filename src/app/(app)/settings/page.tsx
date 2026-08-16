import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { getUserSettings } from "@/lib/settings";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default async function SettingsPage() {
  const userId = await requireSessionUserId();

  const [user, settings, startingEntry] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    getUserSettings(userId),
    prisma.bodyWeightEntry.findFirst({
      where: { userId },
      orderBy: { date: "asc" },
      select: { id: true, date: true, weightKg: true, note: true },
    }),
  ]);

  return (
    <SettingsScreen
      initialName={user?.name ?? ""}
      email={user?.email ?? ""}
      memberSince={user!.createdAt.toISOString()}
      initialUnits={settings.units}
      startingWeightEntry={
        startingEntry
          ? {
              id: startingEntry.id,
              date: startingEntry.date.toISOString(),
              weightKg: startingEntry.weightKg,
              note: startingEntry.note,
            }
          : null
      }
    />
  );
}
