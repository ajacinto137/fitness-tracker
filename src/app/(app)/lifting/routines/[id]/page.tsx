import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { RoutineEditorScreen } from "@/components/lifting/RoutineEditorScreen";

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireSessionUserId();

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
