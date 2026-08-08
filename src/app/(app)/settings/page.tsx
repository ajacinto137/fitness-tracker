import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
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
