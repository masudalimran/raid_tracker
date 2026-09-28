const STORAGE_KEY = "path_event_points";

export const DEFAULT_PATH_EVENT_POINTS: Record<string, number> = {
  mystery: 3,
  ancient: 300,
  void: 750,
  primal: 1800,
  sacred: 4500,
};

/** Point values per shard tier — falls back to defaults for any tier the user hasn't customised. */
export function getPathEventPoints(): Record<string, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return { ...DEFAULT_PATH_EVENT_POINTS };
    return { ...DEFAULT_PATH_EVENT_POINTS, ...stored };
  } catch {
    return { ...DEFAULT_PATH_EVENT_POINTS };
  }
}

export function savePathEventPoints(points: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}

export function resetPathEventPoints(): void {
  localStorage.removeItem(STORAGE_KEY);
}
