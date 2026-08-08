import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoutineListScreen } from "@/components/lifting/RoutineListScreen";

export default async function RoutinesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const routines = await prisma.workoutRoutine.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
  });

  return <RoutineListScreen initialRoutines={routines} />;
}
