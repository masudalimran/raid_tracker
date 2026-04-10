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

export function getStatScore(c: IChampion): number {
  const checks: number[] = [];
  const role = c.role ?? [];

  // Universal: speed matters for every champion
  checks.push(statProximity(c.spd, 180));

  // Accuracy-reliant roles — landing debuffs/CC requires ACC
  if (
    role.includes(ChampionRole.DEBUFFER) ||
    role.includes(ChampionRole.TM_REDUCER) ||
    role.includes(ChampionRole.CONTROL) ||
    role.includes(ChampionRole.POISONER) ||
    role.includes(ChampionRole.HP_BURNER) ||
    role.includes(ChampionRole.BLOCK_BUFF) ||
    c.type === ChampionType.SUPPORT
  ) {
    checks.push(statProximity(c.acc, 250));
  }

  // Crit-based offense — nukers and boss killers live and die by crit
  if (
    role.includes(ChampionRole.NUKER) ||
    role.includes(ChampionRole.BOSS_KILLER) ||
    c.type === ChampionType.ATTACK
  ) {
    checks.push(statProximity(c.c_rate, 100));
    checks.push(statProximity(c.c_dmg, 200));
  }

  // Raw attack for Attack-type champions
  if (c.type === ChampionType.ATTACK) {
    checks.push(statProximity(c.atk, 3500));
  }

  // Defense scaling
  if (c.type === ChampionType.DEFENSE) {
    checks.push(statProximity(c.def, 4000));
  }

  // HP scaling — tanks and HP-damage dealers both care about raw HP
  if (c.type === ChampionType.HP || role.includes(ChampionRole.MAX_HP_DPS)) {
    checks.push(statProximity(c.hp, 45000));
  }

  return checks.length === 0 ? 0 : checks.reduce((a, b) => a + b, 0) / checks.length;
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
  const scored = champions
    .filter((c) => c.is_mastery_needed && !c.has_mastery && getTeamScore(c, teams) > 0)
    .map((c) => ({ champion: c, priority: getMasteryPriority(c, teams) }));

  const priorities = scored.map((s) => s.priority);
  const min = Math.min(...priorities);
  const max = Math.max(...priorities);
  const range = max - min;

  return scored
    .sort((a, b) => b.priority - a.priority)
    .map(({ champion, priority }) => ({
      ...champion,
      priority:
        range === 0 ? 50 : Math.round(((priority - min) / range) * 10000) / 100,
    }));
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
  const scored = champions
    .filter((c) => c.is_book_needed && !c.is_booked && c.rarity === rarity && getTeamScore(c, teams) > 0)
    .map((c) => ({ champion: c, priority: getBookPriority(c, teams) }));

  const priorities = scored.map((s) => s.priority);
  const min = Math.min(...priorities);
  const max = Math.max(...priorities);
  const range = max - min;

  return scored
    .sort((a, b) => b.priority - a.priority)
    .map(({ champion, priority }) => ({
      ...champion,
      priority:
        range === 0 ? 50 : Math.round(((priority - min) / range) * 10000) / 100,
    }));
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
