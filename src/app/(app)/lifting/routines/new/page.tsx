import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoutineEditorScreen } from "@/components/lifting/RoutineEditorScreen";

export default async function NewRoutinePage() {
  const session = await auth();
  const userId = session!.user.id;

  const exercises = await prisma.exercise.findMany({ where: { userId }, orderBy: { name: "asc" } });

  return <RoutineEditorScreen availableExercises={exercises} />;
}
