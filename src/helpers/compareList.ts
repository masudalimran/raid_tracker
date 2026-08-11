// Cross-page "champion comparison" list — persisted so the Compare toggle on
// any ChampionCard, the topbar badge, and the Champion Comparison page all
// stay in sync without prop-drilling. Fires a custom event on every change
// (localStorage's own "storage" event only fires in OTHER tabs, not this one).

const STORAGE_KEY = "compare_champion_ids";
export const COMPARE_LIST_EVENT = "compare-list-changed";
export const MAX_COMPARE = 4;

export function getCompareList(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function setCompareList(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(COMPARE_LIST_EVENT));
}

export function isInCompareList(id: string | number | undefined | null): boolean {
  if (id == null) return false;
  return getCompareList().includes(String(id));
}

/** Returns false (no-op) when the champion is already in the list, or the list is already at MAX_COMPARE. */
export function addToCompareList(id: string | number | undefined | null): boolean {
  if (id == null) return false;
  const sid = String(id);
  const current = getCompareList();
  if (current.includes(sid)) return true;
  if (current.length >= MAX_COMPARE) return false;
  setCompareList([...current, sid]);
  return true;
}

export function removeFromCompareList(id: string | number | undefined | null): void {
  if (id == null) return;
  const sid = String(id);
  setCompareList(getCompareList().filter((x) => x !== sid));
}

/** Returns false only when trying to add past MAX_COMPARE. */
export function toggleCompareList(id: string | number | undefined | null): boolean {
  if (isInCompareList(id)) {
    removeFromCompareList(id);
    return true;
  }
  return addToCompareList(id);
}
