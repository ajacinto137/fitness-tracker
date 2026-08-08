import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LiftingDashboardScreen } from "@/components/lifting/LiftingDashboardScreen";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export default async function LiftingDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [activeWorkout, recentWorkouts, routines, recentWorkoutExercises, workoutsThisWeek, recentPR] =
    await Promise.all([
      prisma.workout.findFirst({
        where: { userId, finishedAt: null },
        orderBy: { startedAt: "desc" },
      }),
      prisma.workout.findMany({
        where: { userId, finishedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { _count: { select: { exercises: true } } },
      }),
      prisma.workoutRoutine.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { exercises: { include: { exercise: true } } },
      }),
      prisma.workoutExercise.findMany({
        where: { workout: { userId, finishedAt: { not: null } } },
        orderBy: { workout: { startedAt: "desc" } },
        take: 20,
        include: { exercise: true },
      }),
      prisma.workout.count({
        where: { userId, startedAt: { gte: startOfWeek(new Date()) } },
      }),
      prisma.personalRecord.findFirst({
        where: { userId },
        orderBy: { achievedAt: "desc" },
        include: { exercise: true },
      }),
    ]);

  const seen = new Set<string>();
  const recentExercises = [];
  for (const we of recentWorkoutExercises) {
    if (seen.has(we.exerciseId)) continue;
    seen.add(we.exerciseId);
    recentExercises.push(we.exercise);
    if (recentExercises.length >= 5) break;
  }

  return (
    <LiftingDashboardScreen
      activeWorkout={activeWorkout}
      recentWorkouts={recentWorkouts.map((w) => ({
        id: w.id,
        name: w.name,
        startedAt: w.startedAt.toISOString(),
        finishedAt: w.finishedAt?.toISOString() ?? null,
        exerciseCount: w._count.exercises,
      }))}
      routines={routines}
      recentExercises={recentExercises}
      workoutsThisWeek={workoutsThisWeek}
      recentPR={
        recentPR
          ? {
              exerciseName: recentPR.exercise?.name ?? "Overall",
              type: recentPR.type,
              value: recentPR.value,
              achievedAt: recentPR.achievedAt.toISOString(),
            }
          : null
      }
    />
  );
}
