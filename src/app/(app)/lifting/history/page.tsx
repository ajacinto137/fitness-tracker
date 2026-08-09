import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { HistoryListScreen } from "@/components/lifting/HistoryListScreen";

export default async function HistoryPage() {
  const userId = await requireSessionUserId();

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
