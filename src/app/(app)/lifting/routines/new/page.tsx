import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { RoutineEditorScreen } from "@/components/lifting/RoutineEditorScreen";

export default async function NewRoutinePage() {
  const userId = await requireSessionUserId();

  const exercises = await prisma.exercise.findMany({ where: { userId }, orderBy: { name: "asc" } });

  return <RoutineEditorScreen availableExercises={exercises} />;
}
