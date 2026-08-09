import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/session";
import { ExerciseLibraryScreen } from "@/components/lifting/ExerciseLibraryScreen";

export default async function ExerciseLibraryPage() {
  const userId = await requireSessionUserId();

  const exercises = await prisma.exercise.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return <ExerciseLibraryScreen initialExercises={exercises} />;
}
