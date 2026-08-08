import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HistoryListScreen } from "@/components/lifting/HistoryListScreen";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const workouts = await prisma.workout.findMany({
    where: { userId, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { _count: { select: { exercises: true } } },
  });

  return (
    <HistoryListScreen
      workouts={workouts.map((w) => ({
        id: w.id,
        name: w.name,
        startedAt: w.startedAt.toISOString(),
        finishedAt: w.finishedAt!.toISOString(),
        exerciseCount: w._count.exercises,
      }))}
    />
  );
}
