import type IChampion from "../models/IChampion";
import { getChampionRoleMatches, type AreaRoleReq } from "../data/areaRoleRequirements";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";
import { getStatScore } from "./sortChampions";

export interface SuggestedDeckEntry {
  champion: IChampion;
  matchedLabels: string[];
}

const impactOf = (champion: IChampion): number =>
  champion.champion_impact ?? getStatScore(champion) * 1000;

/**
 * Builds one Grim Forest deck: greedily covers each required role first (same
 * set-cover approach as suggestTeam), then fills remaining slots with the
 * most-built champions left in the pool — built status beats raw stat impact,
 * per how Grim Forest decks are meant to be prioritized.
 */
function suggestOneDeck(
  pool: IChampion[],
  requiredRoles: AreaRoleReq[],
  deckSize: number,
): SuggestedDeckEntry[] {
  const uncovered = new Set(requiredRoles.map((_, i) => i));
  const picked = new Set<string>();
  const result: SuggestedDeckEntry[] = [];

  while (result.length < deckSize && uncovered.size > 0) {
    let best: IChampion | null = null;
    let bestNewCoverage = 0;
    let bestImpact = -1;

    for (const champ of pool) {
      if (champ.id === undefined || champ.id === null) continue;
      const id = champ.id.toString();
      if (picked.has(id)) continue;

      const newCoverage = requiredRoles.reduce((count, req, i) => {
        if (!uncovered.has(i)) return count;
        return req.matchRoles?.some((role) => champ.role?.includes(role)) ? count + 1 : count;
      }, 0);
      if (newCoverage === 0) continue;
      const impact = impactOf(champ);

      if (newCoverage > bestNewCoverage || (newCoverage === bestNewCoverage && impact > bestImpact)) {
        best = champ;
        bestNewCoverage = newCoverage;
        bestImpact = impact;
      }
    }

    if (!best) break;
    const id = best.id!.toString();
    picked.add(id);
    requiredRoles.forEach((req, i) => {
      if (uncovered.has(i) && req.matchRoles?.some((role) => best!.role?.includes(role))) {
        uncovered.delete(i);
      }
    });
    result.push({ champion: best, matchedLabels: getChampionRoleMatches(best, requiredRoles) });
  }

  const remaining = pool
    .filter((c) => c.id !== undefined && c.id !== null && !picked.has(c.id!.toString()))
    .sort((a, b) => {
      const builtDiff = Number(checkIfChampionIsBuilt(b)) - Number(checkIfChampionIsBuilt(a));
      if (builtDiff !== 0) return builtDiff;
      return impactOf(b) - impactOf(a);
    });

  for (const champ of remaining) {
    if (result.length >= deckSize) break;
    result.push({ champion: champ, matchedLabels: getChampionRoleMatches(champ, requiredRoles) });
  }

  return result;
}

/** Suggests both Grim Forest decks at once — deck 2 is built from whatever deck 1 didn't take, so no champion appears in both. */
export function suggestGrimForestDecks(
  champions: IChampion[],
  requiredRoles: AreaRoleReq[],
  deckSize: number,
): { deck1: SuggestedDeckEntry[]; deck2: SuggestedDeckEntry[] } {
  const pool = champions.filter((c) => c.id !== undefined && c.id !== null);
  const deck1 = suggestOneDeck(pool, requiredRoles, deckSize);
  const deck1Ids = new Set(deck1.map((e) => e.champion.id!.toString()));
  const remainingPool = pool.filter((c) => !deck1Ids.has(c.id!.toString()));
  const deck2 = suggestOneDeck(remainingPool, requiredRoles, deckSize);
  return { deck1, deck2 };
}
