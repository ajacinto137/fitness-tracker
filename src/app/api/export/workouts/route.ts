import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling } from "@/lib/api";
import { fromKg, roundWeight, unitLabel } from "@/lib/units";
import { totalVolume } from "@/lib/calculations";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const [workouts, settings] = await Promise.all([
      prisma.workout.findMany({
        where: { userId },
        orderBy: { startedAt: "asc" },
        include: { exercises: { include: { sets: true } } },
      }),
      prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
    ]);

    const rows = workouts.map((w) => {
      const allSets = w.exercises.flatMap((e) => e.sets);
      const completedSets = allSets.filter((s) => s.completed);
      const durationMin = w.finishedAt
        ? Math.round((w.finishedAt.getTime() - w.startedAt.getTime()) / 60000)
        : "";
      return [
        w.startedAt.toISOString(),
        w.name,
        durationMin,
        w.exercises.length,
        completedSets.length,
        roundWeight(fromKg(totalVolume(completedSets), settings.units)),
        unitLabel(settings.units),
      ];
    });

    const csv = toCsv(
      ["Date", "Workout Name", "Duration (min)", "Exercises", "Completed Sets", "Total Volume", "Unit"],
      rows
    );
    return csvResponse("workout-history.csv", csv);
  });
}
