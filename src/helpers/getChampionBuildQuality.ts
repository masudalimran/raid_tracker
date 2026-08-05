import { ChampionRole } from "../models/ChampionRole";
import { ChampionType } from "../models/ChampionType";
import type IChampion from "../models/IChampion";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";

export type BuildQuality = "built" | "needs_improvement" | "needs_level" | "not_built" | "untouched";

// Number of stats below threshold that triggers "Needs Improvement"
const IMPROVEMENT_THRESHOLD = 3;

/** Returns how many stats fall below the champion's expected thresholds. */
export function getThresholdFailCount(champion: IChampion): number {
  const role = champion.role ?? [];
  let fails = 0;

  const check = (value: number, threshold: number) => {
    if (threshold > 0 && value < threshold) fails++;
  };

  check(champion.hp,     champion.type === ChampionType.HP ? 45000 : 30000);
  check(champion.atk,    champion.type === ChampionType.ATTACK && role.includes(ChampionRole.NUKER) ? 4000 : 0);
  check(champion.def,    champion.type === ChampionType.DEFENSE ? 4000 : 2500);
  check(champion.spd,    role.includes(ChampionRole.DEBUFFER) ? 180 : 160);
  check(champion.c_rate, role.includes(ChampionRole.NUKER) ? 100 : 0);
  check(champion.c_dmg,  role.includes(ChampionRole.NUKER) || role.includes(ChampionRole.MAX_HP_DPS) ? 200 : 0);
  check(champion.acc,    role.includes(ChampionRole.DEBUFFER) || role.includes(ChampionRole.TM_REDUCER) ? 200 : 0);

  return fails;
}

/** Returns true when a champion has 3 or more stats below threshold (but is otherwise built). */
export function needsImprovement(champion: IChampion): boolean {
  return getThresholdFailCount(champion) >= IMPROVEMENT_THRESHOLD;
}

/** A champion that's otherwise built should be levelled to exactly 10x its star rating (6★ → 60, 5★ → 50, ...). */
export function needsLevel(champion: IChampion): boolean {
  return champion.level !== champion.stars * 10;
}

/**
 * Full build quality bucket for a champion. Only champions that clear the
 * "built" bar (5+ stars, stats/book/mastery thresholds met) are checked for
 * the level requirement — a champion that would otherwise be "built" or
 * "needs_improvement" but is under/over-levelled for its star count is
 * reclassified as "needs_level" instead, taking priority over both.
 */
export function getBuildQuality(champion: IChampion, isBuilt: boolean): BuildQuality {
  if (champion.spd <= 120) return "untouched";
  if (!isBuilt) return "not_built";
  if (needsLevel(champion)) return "needs_level";
  if (needsImprovement(champion)) return "needs_improvement";
  return "built";
}

export interface ChampionBuildBreakdown {
  total: number;
  built: number;
  needsImprovement: number;
  needsLevel: number;
  notBuilt: number;
  untouched: number;
}

/** Single source of truth for the 5 mutually-exclusive build-status buckets, used across Home, Champions, and Analytics. */
export function getChampionBuildBreakdown(champions: IChampion[]): ChampionBuildBreakdown {
  const breakdown: ChampionBuildBreakdown = {
    total: champions.length,
    built: 0,
    needsImprovement: 0,
    needsLevel: 0,
    notBuilt: 0,
    untouched: 0,
  };

  for (const champion of champions) {
    switch (getBuildQuality(champion, checkIfChampionIsBuilt(champion))) {
      case "built": breakdown.built++; break;
      case "needs_improvement": breakdown.needsImprovement++; break;
      case "needs_level": breakdown.needsLevel++; break;
      case "not_built": breakdown.notBuilt++; break;
      case "untouched": breakdown.untouched++; break;
    }
  }

  return breakdown;
}
