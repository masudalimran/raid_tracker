/**
 * Role requirement overrides stored in Supabase (role_req table).
 *
 * Caching strategy — mirrors the champion/team list pattern:
 *   READ  → localStorage first, Supabase only when cache is absent
 *   WRITE → Supabase, then update localStorage cache
 *   REFRESH → clear cache key; next read re-fetches from Supabase
 */

import { supabase } from "../lib/supabaseClient";
import type { AreaRoleReq } from "../data/areaRoleRequirements";

export const ROLE_REQ_CACHE_KEY = "supabase_role_req_list";

// ── Internal types ────────────────────────────────────────────────────────────

interface RoleReqRow {
  id?: string;
  user_id?: string;
  rsl_account_id: string;
  team_key: string;
  requirements: AreaRoleReq[];
  updated_at?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCachedRows(): RoleReqRow[] {
  try {
    return JSON.parse(localStorage.getItem(ROLE_REQ_CACHE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setCachedRows(rows: RoleReqRow[]): void {
  localStorage.setItem(ROLE_REQ_CACHE_KEY, JSON.stringify(rows));
}

function getActiveAccountId(): string | null {
  try {
    const accounts = JSON.parse(localStorage.getItem("supabase_rsl_account_list") ?? "[]");
    return accounts.find((a: { is_currently_active: boolean }) => a.is_currently_active)?.id ?? null;
  } catch {
    return null;
  }
}

function getUserId(): string | null {
  try {
    const auth = JSON.parse(localStorage.getItem("supabase_auth") ?? "{}");
    // The app stores the user object directly: { id, email, ... }
    return auth?.id ?? auth?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all role requirements for the active account from Supabase and cache
 * them locally.  Only called when the cache is absent (first load or after
 * a manual refresh).
 */
export async function fetchRoleRequirements(): Promise<void> {
  const accountId = getActiveAccountId();
  if (!accountId) return;

  const { data, error } = await supabase
    .from("role_req")
    .select("*")
    .eq("rsl_account_id", accountId);

  if (!error && data) {
    setCachedRows(data as RoleReqRow[]);
  }
}

/**
 * Ensure requirements are in the local cache.  Safe to call every time a team
 * page mounts — only hits Supabase when the cache is empty.
 */
export async function ensureRoleRequirementsLoaded(): Promise<void> {
  if (localStorage.getItem(ROLE_REQ_CACHE_KEY) !== null) return;
  await fetchRoleRequirements();
}

/** Synchronous cache read — always fast.  Returns null when no override exists. */
export function getTeamOverride(teamKey: string): AreaRoleReq[] | null {
  const accountId = getActiveAccountId();
  if (!accountId) return null;
  const row = getCachedRows().find(
    (r) => r.rsl_account_id === accountId && r.team_key === teamKey,
  );
  return row ? row.requirements : null;
}

/** Upsert to Supabase then update the local cache. */
export async function saveTeamOverride(
  teamKey: string,
  reqs: AreaRoleReq[],
): Promise<void> {
  const accountId = getActiveAccountId();
  const userId    = getUserId();
  if (!accountId || !userId) return;

  const { data, error } = await supabase
    .from("role_req")
    .upsert(
      { user_id: userId, rsl_account_id: accountId, team_key: teamKey, requirements: reqs },
      { onConflict: "rsl_account_id,team_key" },
    )
    .select()
    .single();

  if (error) {
    console.error("[role_req] save failed:", error.message);
    return;
  }
  if (data) {
    const rows = getCachedRows().filter(
      (r) => !(r.rsl_account_id === accountId && r.team_key === teamKey),
    );
    rows.push(data as RoleReqRow);
    setCachedRows(rows);
  }
}

/** Delete from Supabase then remove from local cache. */
export async function clearTeamOverride(teamKey: string): Promise<void> {
  const accountId = getActiveAccountId();
  if (!accountId) return;

  await supabase
    .from("role_req")
    .delete()
    .eq("rsl_account_id", accountId)
    .eq("team_key", teamKey);

  setCachedRows(
    getCachedRows().filter(
      (r) => !(r.rsl_account_id === accountId && r.team_key === teamKey),
    ),
  );
}

/** True when the team has a saved override in the local cache. */
export function hasOverride(teamKey: string): boolean {
  return getTeamOverride(teamKey) !== null;
}

/** Clear the local cache — called by the refresh button. */
export function clearRoleReqCache(): void {
  localStorage.removeItem(ROLE_REQ_CACHE_KEY);
}
