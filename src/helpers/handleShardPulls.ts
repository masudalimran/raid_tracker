import { supabase } from "../lib/supabaseClient";
import type { IShardPull, ShardType } from "../models/IShard";

export const SHARD_PULL_STORAGE_KEY = "shard_pull_log";
const STORAGE_KEY = SHARD_PULL_STORAGE_KEY;

function getActiveAccount(): { id: string } | null {
  try {
    return (
      JSON.parse(localStorage.getItem("supabase_rsl_account_list") ?? "[]")
        .find((acc: { is_currently_active: boolean }) => acc.is_currently_active) ?? null
    );
  } catch {
    return null;
  }
}

export function getActiveRslAccountId(): string | null {
  return getActiveAccount()?.id ?? null;
}

function getUserId(): string | null {
  try {
    const auth = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
    return auth?.id ?? null;
  } catch {
    return null;
  }
}

// Loads every locally-cached pull (across all RSL accounts). Pulls logged
// before account-scoping was introduced have no rsl_account_id — tag them
// with the currently active account so they don't disappear.
export function loadShardPulls(): IShardPull[] {
  let pulls: IShardPull[];
  try {
    pulls = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as IShardPull[];
  } catch {
    return [];
  }

  const activeId = getActiveRslAccountId();
  if (activeId && pulls.some((p) => !p.rsl_account_id)) {
    pulls = pulls.map((p) => (p.rsl_account_id ? p : { ...p, rsl_account_id: activeId }));
    savePulls(pulls);
  }

  return pulls;
}

// Pulls belonging to the currently active RSL account only — this is what
// the Shard Log screen should display.
export function loadShardPullsForActiveAccount(): IShardPull[] {
  const activeId = getActiveRslAccountId();
  if (!activeId) return [];
  return loadShardPulls().filter((p) => p.rsl_account_id === activeId);
}

function savePulls(pulls: IShardPull[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pulls));
}

// ── Cloud sync — same cache pattern used by champions/teams/role_req ──────────

interface ShardPullRow {
  id: string;
  user_id: string;
  rsl_account_id: string;
  shardType: string;
  championName: string;
  rarity: string;
  pulledAt: string;
  notes: string | null;
  imgUrl: string | null;
}

const rowToPull = (row: ShardPullRow): IShardPull => ({
  id: row.id,
  shardType: row.shardType as IShardPull["shardType"],
  championName: row.championName,
  rarity: row.rarity as IShardPull["rarity"],
  pulledAt: row.pulledAt,
  notes: row.notes ?? undefined,
  imgUrl: row.imgUrl ?? undefined,
  rsl_account_id: row.rsl_account_id,
});

/**
 * Fetch the shard pull log for the active RSL account from Supabase,
 * merge it into the local cache (replacing only this account's entries),
 * and return the pulls for the active account.
 */
export async function fetchShardPulls(): Promise<IShardPull[]> {
  const account = getActiveAccount();
  if (!account) return loadShardPullsForActiveAccount();

  const { data, error } = await supabase
    .from("shard_pulls")
    .select("*")
    .eq("rsl_account_id", account.id)
    .order("pulledAt", { ascending: false });

  if (error) {
    console.error("[shard_pulls] fetch failed:", error.message);
    return loadShardPullsForActiveAccount();
  }

  const fetched = (data as ShardPullRow[]).map(rowToPull);
  const otherAccountsPulls = loadShardPulls().filter((p) => p.rsl_account_id !== account.id);
  savePulls([...otherAccountsPulls, ...fetched]);
  return fetched;
}

/**
 * Lazy-load the shard pull log — only hits Supabase on a completely fresh
 * browser/device that has never cached any pulls.
 */
export async function ensureShardPullsLoaded(): Promise<IShardPull[]> {
  if (localStorage.getItem(STORAGE_KEY) !== null) return loadShardPullsForActiveAccount();
  return fetchShardPulls();
}

/**
 * Push the active RSL account's local shard pull log to Supabase so it's
 * visible from other browsers/devices.
 */
export async function syncShardPullsToCloud(
  pulls: IShardPull[],
): Promise<{ success: boolean; error?: string }> {
  const account = getActiveAccount();
  const userId = getUserId();

  if (!account || !userId) {
    return { success: false, error: "No active RSL account or user found." };
  }

  const accountPulls = pulls.filter((p) => !p.rsl_account_id || p.rsl_account_id === account.id);
  if (accountPulls.length === 0) return { success: true };

  const rows: ShardPullRow[] = accountPulls.map((p) => ({
    id: p.id,
    user_id: userId,
    rsl_account_id: account.id,
    shardType: p.shardType,
    championName: p.championName,
    rarity: p.rarity,
    pulledAt: p.pulledAt,
    notes: p.notes ?? null,
    imgUrl: p.imgUrl ?? null,
  }));

  const { error } = await supabase.from("shard_pulls").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("[shard_pulls] sync failed:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function addShardPull(pull: Omit<IShardPull, "id" | "rsl_account_id">): IShardPull {
  const entry: IShardPull = { ...pull, id: crypto.randomUUID(), rsl_account_id: getActiveRslAccountId() ?? undefined };
  const pulls = loadShardPulls();
  pulls.unshift(entry); // newest first
  savePulls(pulls);
  return entry;
}

export function deleteShardPull(id: string): void {
  savePulls(loadShardPulls().filter((p) => p.id !== id));
}

export function updateShardPull(
  id: string,
  updates: Partial<Pick<IShardPull, "championName" | "rarity" | "notes" | "imgUrl">>,
): IShardPull[] {
  const pulls = loadShardPulls();
  const index = pulls.findIndex((p) => p.id === id);
  if (index !== -1) {
    pulls[index] = { ...pulls[index], ...updates };
    savePulls(pulls);
  }
  return pulls.filter((p) => p.rsl_account_id === getActiveRslAccountId());
}

export function clearAllPulls(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Pity counter: how many non-legendary pulls since last legendary for this shard type
export function getPityCount(pulls: IShardPull[], shardType: ShardType): number {
  const filtered = pulls.filter((p) => p.shardType === shardType);
  let count = 0;
  for (const pull of filtered) {
    if (pull.rarity === "Legendary" || pull.rarity === "Mythical") break;
    count++;
  }
  return count;
}

export interface ShardStats {
  total: number;
  epic: number;
  rare: number;
  pityCount: number;
  epicRate: string;
  rareRate: string;
}

export function getShardStats(pulls: IShardPull[], shardType: ShardType): ShardStats {
  const filtered = pulls.filter((p) => p.shardType === shardType);
  const total     = filtered.length;
  const epic      = filtered.filter((p) => p.rarity === "Epic").length;
  const rare      = filtered.filter((p) => p.rarity === "Rare").length;
  const pityCount = getPityCount(pulls, shardType);
  const rate = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(2) : "0.00");
  return {
    total,
    epic,
    rare,
    pityCount,
    epicRate: rate(epic),
    rareRate: rate(rare),
  };
}

/**
 * Reset the pity counter for a shard type by deleting all logged pulls of
 * that type for the active RSL account — both from the local cache and the
 * cloud. Returns the active account's remaining pulls (all shard types).
 */
export async function resetPityForShardType(
  shardType: ShardType,
): Promise<{ success: boolean; pulls: IShardPull[]; error?: string }> {
  const account = getActiveAccount();
  if (!account) {
    return { success: false, pulls: loadShardPullsForActiveAccount(), error: "No active RSL account found." };
  }

  const remaining = loadShardPulls().filter(
    (p) => !(p.rsl_account_id === account.id && p.shardType === shardType),
  );
  savePulls(remaining);
  const accountPulls = remaining.filter((p) => p.rsl_account_id === account.id);

  const { error } = await supabase
    .from("shard_pulls")
    .delete()
    .eq("rsl_account_id", account.id)
    .eq("shardType", shardType);

  if (error) {
    console.error("[shard_pulls] reset failed:", error.message);
    return { success: false, pulls: accountPulls, error: error.message };
  }

  return { success: true, pulls: accountPulls };
}
