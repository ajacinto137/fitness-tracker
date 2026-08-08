import { prisma } from "@/lib/prisma";
import { requireUserId, withErrorHandling } from "@/lib/api";
import { fromKg, roundWeight, unitLabel } from "@/lib/units";
import { formatDateOnly } from "@/lib/date";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const [entries, settings] = await Promise.all([
      prisma.bodyWeightEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
      prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
    ]);

    const rows = entries.map((e) => [
      formatDateOnly(e.date),
      roundWeight(fromKg(e.weightKg, settings.units)),
      unitLabel(settings.units),
      e.note ?? "",
    ]);

    const csv = toCsv(["Date", "Weight", "Unit", "Note"], rows);
    return csvResponse("body-weight-history.csv", csv);
  });
}
