import type IChampion from "../models/IChampion";
import {
  getChampionRoleMatches,
  type AreaRoleReq,
} from "../data/areaRoleRequirements";
import { getStatScore } from "./sortChampions";

export interface SuggestedTeamEntry {
  champion: IChampion;
  matchedLabels: string[];
}

const impactOf = (champion: IChampion): number =>
  champion.champion_impact ?? getStatScore(champion) * 1000;

/**
 * Greedy set-cover: repeatedly picks whichever champion in the full pool
 * (selected or not) covers the most still-uncovered required roles, tying
 * on power score. Once every role is covered, remaining slots are filled
 * by strongest-remaining champion. Because it considers the whole pool
 * rather than only unselected champions, it can recommend swapping out a
 * currently-selected champion for a better-fitting one.
 */
export function suggestTeam(
  champions: IChampion[],
  requiredRoles: AreaRoleReq[],
  teamSize: number,
): SuggestedTeamEntry[] {
  const pool = champions.filter((c) => c.id !== undefined && c.id !== null);
  const uncovered = new Set(requiredRoles.map((_, i) => i));
  const picked = new Set<string>();
  const result: SuggestedTeamEntry[] = [];

  while (result.length < teamSize && picked.size < pool.length) {
    let best: IChampion | null = null;
    let bestNewCoverage = -1;
    let bestImpact = -1;

    for (const champ of pool) {
      const id = champ.id!.toString();
      if (picked.has(id)) continue;

      const newCoverage = requiredRoles.reduce((count, req, i) => {
        if (!uncovered.has(i)) return count;
        return req.matchRoles?.some((role) => champ.role?.includes(role))
          ? count + 1
          : count;
      }, 0);
      const impact = impactOf(champ);

      if (
        newCoverage > bestNewCoverage ||
        (newCoverage === bestNewCoverage && impact > bestImpact)
      ) {
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
    result.push({
      champion: best,
      matchedLabels: getChampionRoleMatches(best, requiredRoles),
    });
  }

  return result;
}
