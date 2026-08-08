import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExerciseLibraryScreen } from "@/components/lifting/ExerciseLibraryScreen";

export default async function ExerciseLibraryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const exercises = await prisma.exercise.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return <ExerciseLibraryScreen initialExercises={exercises} />;
}
