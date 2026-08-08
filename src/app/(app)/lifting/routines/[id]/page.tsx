import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoutineEditorScreen } from "@/components/lifting/RoutineEditorScreen";

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [routine, exercises] = await Promise.all([
    prisma.workoutRoutine.findFirst({
      where: { id, userId },
      include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
    }),
    prisma.exercise.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!routine) notFound();

  return <RoutineEditorScreen routine={routine} availableExercises={exercises} />;
}
