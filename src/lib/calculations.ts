/**
 * Reusable training-math utilities.
 * Kept isolated so formulas (e.g. the 1RM estimate) can be swapped later
 * without touching call sites.
 */

export interface SetLike {
  weightKg: number;
  reps: number;
  /** Right-side weight/reps for unilateral (single arm/leg) exercises. */
  weightKgRight?: number | null;
  repsRight?: number | null;
  completed: boolean;
}

/**
 * Estimated one-rep max using the Epley formula: weight * (1 + reps / 30).
 * This is an estimate, not a measured max — always label it as such in the UI.
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/**
 * Total volume (weight x reps) for a list of sets. Only completed sets
 * should be passed in. For unilateral sets, both sides count separately.
 */
export function totalVolume(sets: SetLike[]): number {
  return sets.reduce((sum, s) => {
    if (!s.completed) return sum;
    const rightVolume = (s.weightKgRight ?? 0) * (s.repsRight ?? 0);
    return sum + s.weightKg * s.reps + rightVolume;
  }, 0);
}

/**
 * The heaviest completed side-set by weight (ties broken by higher reps).
 * For unilateral sets, the left and right sides are each considered
 * independently, since limb strength commonly differs.
 */
export function heaviestSet(sets: SetLike[]): { weightKg: number; reps: number } | null {
  let best: { weightKg: number; reps: number } | null = null;
  for (const s of sets) {
    if (!s.completed) continue;
    const sides = [{ weightKg: s.weightKg, reps: s.reps }];
    if (s.weightKgRight != null || s.repsRight != null) {
      sides.push({ weightKg: s.weightKgRight ?? 0, reps: s.repsRight ?? 0 });
    }
    for (const side of sides) {
      if (side.weightKg <= 0) continue;
      if (!best || side.weightKg > best.weightKg || (side.weightKg === best.weightKg && side.reps > best.reps)) {
        best = side;
      }
    }
  }
  return best;
}

/** The best estimated 1RM among completed sets (either side, for unilateral). */
export function bestEstimatedOneRepMax(sets: SetLike[]): number {
  return sets.reduce((max, s) => {
    if (!s.completed) return max;
    let next = Math.max(max, estimateOneRepMax(s.weightKg, s.reps));
    if (s.weightKgRight != null || s.repsRight != null) {
      next = Math.max(next, estimateOneRepMax(s.weightKgRight ?? 0, s.repsRight ?? 0));
    }
    return next;
  }, 0);
}

export interface DatedValue {
  date: Date;
  value: number;
}

/**
 * Trailing simple moving average over `windowDays` calendar days.
 * Input must be sorted ascending by date. Missing days are not interpolated;
 * the average is computed over whatever points fall within the trailing window.
 */
export function movingAverage(points: DatedValue[], windowDays: number): DatedValue[] {
  const result: DatedValue[] = [];
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const windowStart = current.date.getTime() - (windowDays - 1) * 86_400_000;
    let sum = 0;
    let count = 0;
    for (let j = i; j >= 0; j--) {
      if (points[j].date.getTime() < windowStart) break;
      sum += points[j].value;
      count++;
    }
    result.push({ date: current.date, value: count > 0 ? sum / count : current.value });
  }
  return result;
}

export type TimeRangeKey = "1M" | "3M" | "6M" | "1Y" | "ALL";

export function startDateForRange(range: TimeRangeKey, now: Date = new Date()): Date | null {
  const d = new Date(now);
  switch (range) {
    case "1M":
      d.setMonth(d.getMonth() - 1);
      return d;
    case "3M":
      d.setMonth(d.getMonth() - 3);
      return d;
    case "6M":
      d.setMonth(d.getMonth() - 6);
      return d;
    case "1Y":
      d.setFullYear(d.getFullYear() - 1);
      return d;
    case "ALL":
      return null;
  }
}
