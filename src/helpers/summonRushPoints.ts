const STORAGE_KEY = "summon_rush_points";

export const DEFAULT_SUMMON_RUSH_POINTS: Record<string, number> = {
  mystery: 1,
  ancient: 20,
  void: 120,
  primal: 200,
  sacred: 500,
};

/** Point values per shard tier — falls back to defaults for any tier the user hasn't customised. */
export function getSummonRushPoints(): Record<string, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return { ...DEFAULT_SUMMON_RUSH_POINTS };
    return { ...DEFAULT_SUMMON_RUSH_POINTS, ...stored };
  } catch {
    return { ...DEFAULT_SUMMON_RUSH_POINTS };
  }
}

export function saveSummonRushPoints(points: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}

export function resetSummonRushPoints(): void {
  localStorage.removeItem(STORAGE_KEY);
}
