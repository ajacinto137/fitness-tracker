import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling } from "@/lib/api";
import { fromKg, roundWeight, unitLabel } from "@/lib/units";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const [workoutExercises, settings] = await Promise.all([
      prisma.workoutExercise.findMany({
        where: { workout: { userId } },
        include: { exercise: true, workout: true, sets: { orderBy: { setNumber: "asc" } } },
        orderBy: { workout: { startedAt: "asc" } },
      }),
      prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
    ]);

    const rows = workoutExercises.flatMap((we) =>
      we.sets.map((s) => [
        we.workout.startedAt.toISOString(),
        we.workout.name,
        we.exercise.name,
        s.setNumber,
        roundWeight(fromKg(s.weightKg, settings.units)),
        unitLabel(settings.units),
        s.reps,
        s.completed ? "yes" : "no",
      ])
    );

    const csv = toCsv(
      ["Date", "Workout Name", "Exercise", "Set", "Weight", "Unit", "Reps", "Completed"],
      rows
    );
    return csvResponse("exercise-set-history.csv", csv);
  });
}
