import { ChampionRole } from "../models/ChampionRole";
import { ChampionType } from "../models/ChampionType";
import type IChampion from "../models/IChampion";

export type BuildQuality = "built" | "needs_improvement" | "not_built" | "untouched";

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

/** Full build quality bucket for a champion. */
export function getBuildQuality(champion: IChampion, isBuilt: boolean): BuildQuality {
  if (champion.spd <= 120) return "untouched";
  if (!isBuilt) return "not_built";
  if (needsImprovement(champion)) return "needs_improvement";
  return "built";
}
