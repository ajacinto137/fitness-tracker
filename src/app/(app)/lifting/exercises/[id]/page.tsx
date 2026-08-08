import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getExerciseDetail } from "@/lib/exercise-detail";
import { ExerciseDetailScreen } from "@/components/lifting/ExerciseDetailScreen";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [detail, settings] = await Promise.all([
    getExerciseDetail(userId, id),
    prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
  ]);

  if (!detail) notFound();

  return (
    <ExerciseDetailScreen
      exercise={detail.exercise}
      history={detail.history.map((h) => ({ ...h, date: h.date.toISOString() }))}
      personalRecords={detail.personalRecords.map((p) => ({ ...p, achievedAt: p.achievedAt.toISOString() }))}
      summary={{
        ...detail.summary,
        lastPerformed: detail.summary.lastPerformed?.toISOString() ?? null,
      }}
      units={settings.units}
    />
  );
}
