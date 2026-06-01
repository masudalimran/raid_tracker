/**
 * Role requirement overrides stored in Supabase (role_req table).
 *
 * Follows the same cache-first pattern as champions and teams:
 *   READ    → localStorage cache first, Supabase only when cache is absent
 *   WRITE   → check cache for existing row → INSERT or UPDATE accordingly
 *   REFRESH → clear cache key; next read re-fetches from Supabase
 */

import { supabase } from "../lib/supabaseClient";
import type { AreaRoleReq } from "../data/areaRoleRequirements";

export const ROLE_REQ_CACHE_KEY = "supabase_role_req_list";

// ── Internal types ────────────────────────────────────────────────────────────

interface RoleReqRow {
  id: string;
  user_id: string;
  rsl_account_id: string;
  team_key: string;
  requirements: AreaRoleReq[];
  updated_at?: string;
}

// ── Helpers — same pattern used by handleChampions / handleTeams ──────────────

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

function getUserId(): string | null {
  try {
    // The app stores auth as { id, email, ... } — same destructure used in ChampionForm
    const auth = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
    return auth?.id ?? null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all role requirements for the active account from Supabase and cache.
 * Mirrors fetchTeams() pattern — cache-check done by the caller.
 */
export async function fetchRoleRequirements(): Promise<void> {
  const account = getActiveAccount();
  if (!account) return;

  const { data, error } = await supabase
    .from("role_req")
    .select("*")
    .eq("rsl_account_id", account.id);

  if (error) {
    console.error("[role_req] fetch failed:", error.message);
    return;
  }

  setCachedRows((data ?? []) as RoleReqRow[]);
}

/**
 * Ensure cache is populated — same pattern as the champion/team lazy-load.
 * Safe to call on every team page mount; only hits Supabase when cache is absent.
 */
export async function ensureRoleRequirementsLoaded(): Promise<void> {
  if (localStorage.getItem(ROLE_REQ_CACHE_KEY) !== null) return;
  await fetchRoleRequirements();
}

/** Synchronous cache read — returns null when no override exists for this team. */
export function getTeamOverride(teamKey: string): AreaRoleReq[] | null {
  const account = getActiveAccount();
  if (!account) return null;
  const row = getCachedRows().find(
    (r) => r.rsl_account_id === account.id && r.team_key === teamKey,
  );
  return row ? row.requirements : null;
}

/** True when the team has a custom override in the local cache. */
export function hasOverride(teamKey: string): boolean {
  return getTeamOverride(teamKey) !== null;
}

/**
 * Save role requirements for a team.
 * Checks the cache for an existing row — uses UPDATE if found, INSERT if not.
 * Mirrors the useTeam addTeam / updateTeam pattern exactly.
 */
export async function saveTeamOverride(
  teamKey: string,
  reqs: AreaRoleReq[],
): Promise<void> {
  const account = getActiveAccount();
  const userId  = getUserId();

  if (!account || !userId) {
    console.error("[role_req] Cannot save — no active RSL account or user in localStorage.");
    return;
  }

  const existing = getCachedRows().find(
    (r) => r.rsl_account_id === account.id && r.team_key === teamKey,
  );

  let saved: RoleReqRow | null = null;

  if (existing?.id) {
    // Row already exists — UPDATE (same as useTeam.updateTeam)
    const { data, error } = await supabase
      .from("role_req")
      .update({ requirements: reqs })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) { console.error("[role_req] update failed:", error.message); return; }
    saved = data as RoleReqRow;
  } else {
    // No row yet — INSERT (same as useTeam.addTeam)
    const { data, error } = await supabase
      .from("role_req")
      .insert([{
        user_id:        userId,
        rsl_account_id: account.id,
        team_key:       teamKey,
        requirements:   reqs,
      }])
      .select()
      .single();

    if (error) { console.error("[role_req] insert failed:", error.message); return; }
    saved = data as RoleReqRow;
  }

  if (saved) {
    const rows = getCachedRows().filter(
      (r) => !(r.rsl_account_id === account.id && r.team_key === teamKey),
    );
    rows.push(saved);
    setCachedRows(rows);
  }
}

/**
 * Delete the override for a team — removes from Supabase and cache.
 */
export async function clearTeamOverride(teamKey: string): Promise<void> {
  const account = getActiveAccount();
  if (!account) return;

  const existing = getCachedRows().find(
    (r) => r.rsl_account_id === account.id && r.team_key === teamKey,
  );

  if (existing?.id) {
    const { error } = await supabase
      .from("role_req")
      .delete()
      .eq("id", existing.id);

    if (error) { console.error("[role_req] delete failed:", error.message); return; }
  }

  setCachedRows(
    getCachedRows().filter(
      (r) => !(r.rsl_account_id === account.id && r.team_key === teamKey),
    ),
  );
}

/** Clear the local cache — called by the Champions page refresh button. */
export function clearRoleReqCache(): void {
  localStorage.removeItem(ROLE_REQ_CACHE_KEY);
}
