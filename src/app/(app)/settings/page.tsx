import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { getUserSettings } from "@/lib/settings";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default async function SettingsPage() {
  const userId = await requireSessionUserId();

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    getUserSettings(userId),
  ]);

  return (
    <SettingsScreen
      initialName={user?.name ?? ""}
      email={user?.email ?? ""}
      memberSince={user!.createdAt.toISOString()}
      initialUnits={settings.units}
    />
  );
}
