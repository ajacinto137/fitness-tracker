import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { RoutineListScreen } from "@/components/lifting/RoutineListScreen";

export default async function RoutinesPage() {
  const userId = await requireSessionUserId();

  const routines = await prisma.workoutRoutine.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
  });

  return <RoutineListScreen initialRoutines={routines} />;
}
