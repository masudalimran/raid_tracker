// helpers/sort.ts

import { TEAM_PRIORITY_WEIGHTS } from "../data/team_priority_weight";
import type { ChampionRarity } from "../models/ChampionRarity";
import { ChampionRole } from "../models/ChampionRole";
import { ChampionType } from "../models/ChampionType";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";

/* ---------------------------------------------
 * Simple sort helpers
 * ------------------------------------------- */

export function sortBySpeedDesc(champions: IChampion[]): IChampion[] {
  return [...champions].sort((a, b) => b.spd - a.spd);
}

export function sortByLevelDesc(champions: IChampion[]): IChampion[] {
  return [...champions].sort((a, b) => b.level - a.level);
}

/* ---------------------------------------------
 * Team impact (dominant factor)
 * ------------------------------------------- */

export function getTeamScore(champion: IChampion, teams: ITeam[]): number {
  return teams.reduce((score, team) => {
    if (!team.champion_ids.includes(String(champion.id))) return score;

    const weight = TEAM_PRIORITY_WEIGHTS[team.team_name] ?? 5;
    return score + weight;
  }, 0);
}

/* ---------------------------------------------
 * Stat proximity helpers
 * ------------------------------------------- */

function statProximity(current: number, target: number): number {
  if (target <= 0) return 1;
  return Math.min(current / target, 1);
}

function getStatScore(c: IChampion): number {
  let score = 0;
  let count = 0;

  if (c.role?.includes(ChampionRole.DEBUFFER)) {
    score += statProximity(c.acc, 200);
    score += statProximity(c.spd, 180);
    count += 2;
  }

  if (c.role?.includes(ChampionRole.TM_REDUCER)) {
    score += statProximity(c.acc, 200);
    score += statProximity(c.spd, 180);
    count += 2;
  }

  if (c.role?.includes(ChampionRole.NUKER)) {
    score += statProximity(c.c_rate, 100);
    score += statProximity(c.c_dmg, 200);
    count += 2;
  }

  if (c.type === ChampionType.DEFENSE) {
    score += statProximity(c.def, 4000);
    count += 1;
  }

  if (c.type === ChampionType.HP) {
    score += statProximity(c.hp, 45000);
    count += 1;
  }

  return count === 0 ? 0 : score / count;
}

/* ---------------------------------------------
 * Completion proximity
 * ------------------------------------------- */

// 📘 Book priority: mastery done = closer to finished
function getBookCompletionScore(c: IChampion): number {
  if (!c.is_book_needed || c.is_booked) return 0;
  return c.has_mastery ? 1 : 0.4;
}

// 📜 Mastery priority: booked = closer to finished
function getMasteryCompletionScore(c: IChampion): number {
  if (!c.is_mastery_needed || c.has_mastery) return 0;
  return c.is_booked ? 1 : 0.4;
}

/* ---------------------------------------------
 * Priority composition
 * ------------------------------------------- */

function getMasteryPriority(c: IChampion, teams: ITeam[]): number {
  const teamScore = getTeamScore(c, teams);
  const statScore = getStatScore(c);
  const completionScore = getMasteryCompletionScore(c);

  return teamScore * 0.5 + statScore * 0.3 + completionScore * 0.2;
}

function getBookPriority(c: IChampion, teams: ITeam[]): number {
  const teamScore = getTeamScore(c, teams);
  const statScore = getStatScore(c);
  const completionScore = getBookCompletionScore(c);

  return teamScore * 0.5 + statScore * 0.3 + completionScore * 0.2;
}

/* ---------------------------------------------
 * Public sort APIs
 * ------------------------------------------- */

export function sortByMasteryPriorityDesc(
  champions: IChampion[],
  teams: ITeam[]
): IChampion[] {
  return champions
    .filter((c) => c.is_mastery_needed && !c.has_mastery)
    .map((c) => ({
      champion: c,
      priority: getMasteryPriority(c, teams),
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ champion, priority }) => ({ ...champion, priority }));
}

export function sortByMasteryPriorityDescTopFive(
  champions: IChampion[],
  teams: ITeam[]
): IChampion[] {
  return sortByMasteryPriorityDesc(champions, teams).slice(0, 5);
}

export function sortByBookPriorityDesc(
  champions: IChampion[],
  teams: ITeam[],
  rarity: ChampionRarity
): IChampion[] {
  return champions
    .filter((c) => c.is_book_needed && !c.is_booked && c.rarity === rarity)
    .map((c) => ({
      champion: c,
      priority: getBookPriority(c, teams),
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ champion, priority }) => ({ ...champion, priority }));
}

export function sortByBookPriorityDescTopFive(
  champions: IChampion[],
  teams: ITeam[],
  rarity: ChampionRarity
): IChampion[] {
  return sortByBookPriorityDesc(champions, teams, rarity).slice(0, 5);
}

/* ---------------------------------------------
 * Generic stat sorting (unchanged)
 * ------------------------------------------- */

export function sortChampions(
  list: IChampion[],
  stat: keyof IChampion,
  order: "asc" | "desc"
) {
  return [...list].sort((a, b) => {
    const av = a[stat];
    const bv = b[stat];

    if (typeof av === "string" && typeof bv === "string") {
      return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }

    return order === "asc"
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });
}
