// NOT CURRENTLY IN USE — retained for potential future re-enabling.
import { ROLE_GEAR_RECS, TYPE_GEAR_RECS } from "../data/gearRecommendations";
import type { SetCombo } from "../data/gearRecommendations";
import type IChampion from "../models/IChampion";
import type { ChampionRole } from "../models/ChampionRole";

export type { SetCombo };

/**
 * Returns up to 2 recommended gear set combinations for a champion.
 * Picks from role-based recommendations first (deduplicated across all roles),
 * then falls back to type-based recommendations if the champion has no roles.
 */
export function getGearRecommendations(champion: IChampion): SetCombo[] {
  const roles = champion.role ?? [];

  if (roles.length === 0) {
    return (TYPE_GEAR_RECS[champion.type] ?? []).slice(0, 2);
  }

  const seen = new Set<string>();
  const result: SetCombo[] = [];

  for (const role of roles) {
    const recs = ROLE_GEAR_RECS[role as ChampionRole] ?? [];
    for (const rec of recs) {
      const key = [...rec.sets].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(rec);
      }
      if (result.length >= 2) break;
    }
    if (result.length >= 2) break;
  }

  // If roles gave only 1 result, try to fill a second from a different role
  if (result.length < 2) {
    for (const role of roles) {
      const recs = ROLE_GEAR_RECS[role as ChampionRole] ?? [];
      for (const rec of recs) {
        const key = [...rec.sets].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          result.push(rec);
          break;
        }
      }
      if (result.length >= 2) break;
    }
  }

  return result;
}
