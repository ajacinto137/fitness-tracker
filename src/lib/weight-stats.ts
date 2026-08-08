export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface WeightStats {
  current: number;
  changeFromPrevious: number | null;
  change7d: number | null;
  change30d: number | null;
}

function closestOnOrBefore(sorted: WeightPoint[], target: Date): WeightPoint | null {
  let candidate: WeightPoint | null = null;
  for (const e of sorted) {
    if (new Date(e.date).getTime() <= target.getTime()) {
      candidate = e;
    } else {
      break;
    }
  }
  return candidate;
}

export function computeWeightStats(entries: WeightPoint[]): WeightStats | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const latestDate = new Date(latest.date);

  const sevenDaysAgo = new Date(latestDate);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const thirtyDaysAgo = new Date(latestDate);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const priorTo7 = closestOnOrBefore(sorted.slice(0, -1), sevenDaysAgo);
  const priorTo30 = closestOnOrBefore(sorted.slice(0, -1), thirtyDaysAgo);

  return {
    current: latest.weightKg,
    changeFromPrevious: previous ? latest.weightKg - previous.weightKg : null,
    change7d: priorTo7 ? latest.weightKg - priorTo7.weightKg : null,
    change30d: priorTo30 ? latest.weightKg - priorTo30.weightKg : null,
  };
}
