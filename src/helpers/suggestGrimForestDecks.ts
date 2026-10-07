import type IChampion from "../models/IChampion";
import { getChampionRoleMatches, type AreaRoleReq } from "../data/areaRoleRequirements";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";
import { getStatScore } from "./sortChampions";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionRole } from "../models/ChampionRole";

export interface SuggestedDeckEntry {
  champion: IChampion;
  matchedLabels: string[];
}

const RARITY_RANK: Record<string, number> = {
  [ChampionRarity.MYTHICAL]: 6,
  [ChampionRarity.LEGENDARY]: 5,
  [ChampionRarity.EPIC]: 4,
  [ChampionRarity.RARE]: 3,
  [ChampionRarity.UNCOMMON]: 2,
  [ChampionRarity.COMMON]: 1,
};

const impactOf = (champion: IChampion): number =>
  champion.champion_impact ?? getStatScore(champion) * 1000;

// Preference order for picking between champions: built status first, then
// rarity tier, then raw stat impact as a final tiebreak — applies both when
// choosing who covers a required role and when filling the remaining slots.
const priorityOf = (champion: IChampion): [number, number, number] => [
  Number(checkIfChampionIsBuilt(champion)),
  RARITY_RANK[champion.rarity] ?? 0,
  impactOf(champion),
];

function comparePriority(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Builds one Grim Forest deck: greedily covers each required role first (same
 * set-cover approach as suggestTeam, but preferring the most-built,
 * highest-rarity champion among ties), then fills remaining slots the same
 * way — most-built, then highest-rarity, among champions with no required role.
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
    let bestPriority: [number, number, number] = [-1, -1, -1];

    for (const champ of pool) {
      if (champ.id === undefined || champ.id === null) continue;
      const id = champ.id.toString();
      if (picked.has(id)) continue;

      const newCoverage = requiredRoles.reduce((count, req, i) => {
        if (!uncovered.has(i)) return count;
        return req.matchRoles?.some((role) => champ.role?.includes(role)) ? count + 1 : count;
      }, 0);
      if (newCoverage === 0) continue;

      const priority = priorityOf(champ);
      if (newCoverage > bestNewCoverage || (newCoverage === bestNewCoverage && comparePriority(priority, bestPriority) > 0)) {
        best = champ;
        bestNewCoverage = newCoverage;
        bestPriority = priority;
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
    .sort((a, b) => comparePriority(priorityOf(b), priorityOf(a)));

  for (const champ of remaining) {
    if (result.length >= deckSize) break;
    result.push({ champion: champ, matchedLabels: getChampionRoleMatches(champ, requiredRoles) });
  }

  return result;
}

/** Suggests both Grim Forest decks at once — deck 2 is built from whatever deck 1 didn't take, so no champion appears in both. Champions tagged Not Viable are never candidates. */
export function suggestGrimForestDecks(
  champions: IChampion[],
  requiredRoles: AreaRoleReq[],
  deckSize: number,
): { deck1: SuggestedDeckEntry[]; deck2: SuggestedDeckEntry[] } {
  const pool = champions.filter(
    (c) => c.id !== undefined && c.id !== null && !c.role?.includes(ChampionRole.NOT_VIABLE),
  );
  const deck1 = suggestOneDeck(pool, requiredRoles, deckSize);
  const deck1Ids = new Set(deck1.map((e) => e.champion.id!.toString()));
  const remainingPool = pool.filter((c) => !deck1Ids.has(c.id!.toString()));
  const deck2 = suggestOneDeck(remainingPool, requiredRoles, deckSize);
  return { deck1, deck2 };
}
