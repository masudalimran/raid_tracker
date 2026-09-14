const STORAGE_KEY = "deck_of_fate_points";

export const DEFAULT_SOUL_POINTS: Record<string, number> = {
  mortal: 65,
  immortal: 650,
  eternal: 3250,
};

/** Point values per soulstone tier — falls back to defaults for any tier the user hasn't customised. */
export function getSoulPoints(): Record<string, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return { ...DEFAULT_SOUL_POINTS };
    return { ...DEFAULT_SOUL_POINTS, ...stored };
  } catch {
    return { ...DEFAULT_SOUL_POINTS };
  }
}

export function saveSoulPoints(points: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}

export function resetSoulPoints(): void {
  localStorage.removeItem(STORAGE_KEY);
}
