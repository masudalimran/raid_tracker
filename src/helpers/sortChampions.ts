// helpers/sort.ts

import type { ChampionRarity } from "../models/ChampionRarity";
import { ChampionRole } from "../models/ChampionRole";
import { ChampionType } from "../models/ChampionType";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";

export function sortBySpeedDesc(champions: IChampion[]): IChampion[] {
  return [...champions].sort((a, b) => b.spd - a.spd);
}

export function sortByLevelDesc(champions: IChampion[]): IChampion[] {
  return [...champions].sort((a, b) => b.level - a.level);
}

type PriorityRule = (champion: IChampion) => boolean;

const COMMON_PRIORITY_RULES: PriorityRule[] = [
  (c) => c.role?.includes(ChampionRole.NUKER) && c.level < 60,
  (c) => c.level < 50,
  (c) => c.is_book_needed && !c.is_booked,
  (c) => c.is_mastery_needed && !c.has_mastery,
  (c) => c.role?.includes(ChampionRole.DEBUFFER) && c.spd < 180,
  (c) => c.spd < 160,
];

type PriorityScoreRule = (champion: IChampion) => number;

function createTeamPriorityRule(teams: ITeam[]): PriorityScoreRule {
  return (champion) => {
    const teamCount = teams.filter((team) =>
      team.champion_ids.includes(String(champion.id))
    ).length;

    return teamCount * 5;
  };
}

function toScoreRules(rules: PriorityRule[]): PriorityScoreRule[] {
  return rules.map((rule) => (champion) => rule(champion) ? 1 : 0);
}

type StatRule = {
  key: keyof Pick<
    IChampion,
    "hp" | "atk" | "def" | "spd" | "c_rate" | "c_dmg" | "res" | "acc"
  >;
  threshold: (c: IChampion) => number;
};

const STAT_PRIORITY_RULES: StatRule[] = [
  {
    key: "hp",
    threshold: (c) => (c.type === ChampionType.HP ? 45000 : 30000),
  },
  {
    key: "atk",
    threshold: (c) =>
      c.type === ChampionType.ATTACK && c.role?.includes(ChampionRole.NUKER)
        ? 4000
        : 0,
  },
  {
    key: "def",
    threshold: (c) => (c.type === ChampionType.DEFENSE ? 4000 : 2500),
  },
  {
    key: "spd",
    threshold: (c) => (c.role?.includes(ChampionRole.DEBUFFER) ? 180 : 160),
  },
  {
    key: "c_rate",
    threshold: (c) => (c.role?.includes(ChampionRole.NUKER) ? 100 : 0),
  },
  {
    key: "c_dmg",
    threshold: (c) => (c.role?.includes(ChampionRole.NUKER) ? 200 : 0),
  },
  {
    key: "res",
    threshold: () => 0,
  },
  {
    key: "acc",
    threshold: (c) =>
      c.role?.includes(ChampionRole.DEBUFFER) ||
      c.role?.includes(ChampionRole.TM_REDUCER)
        ? 200
        : 0,
  },
];

function getStatPriorityRules(): PriorityRule[] {
  return STAT_PRIORITY_RULES.map(
    (rule) => (c: IChampion) =>
      rule.threshold(c) > 0 && c[rule.key] < rule.threshold(c)
  );
}

const MASTERY_PRIORITY_RULES: PriorityRule[] = [
  (c) => c.is_booked && c.is_mastery_needed && !c.has_mastery,
];

function getMasteryPriority(champion: IChampion, teams: ITeam[]): number {
  const baseRules: PriorityScoreRule[] = [
    ...toScoreRules(COMMON_PRIORITY_RULES),
    ...toScoreRules(getStatPriorityRules()),
    ...toScoreRules(MASTERY_PRIORITY_RULES),
    createTeamPriorityRule(teams),
  ];

  const totalPossiblePoints =
    COMMON_PRIORITY_RULES.length +
    getStatPriorityRules().length +
    MASTERY_PRIORITY_RULES.length +
    teams.length * 5; // max possible team points

  const points = baseRules.reduce((sum, rule) => sum + rule(champion), 0);

  return totalPossiblePoints === 0 ? 0 : points / totalPossiblePoints;
}

export function sortByMasteryPriorityDesc(
  champions: IChampion[],
  teams: ITeam[]
): IChampion[] {
  return champions
    .map((c) => ({
      champion: c,
      priority: getMasteryPriority(c, teams),
    }))
    .filter((c) => !c.champion.has_mastery)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(({ champion }) => champion);
}

const BOOK_PRIORITY_RULES: PriorityRule[] = [
  (c) => c.has_mastery && c.is_book_needed && !c.is_booked,
];

function getBookPriority(champion: IChampion, teams: ITeam[]): number {
  const baseRules: PriorityScoreRule[] = [
    ...toScoreRules(COMMON_PRIORITY_RULES),
    ...toScoreRules(getStatPriorityRules()),
    ...toScoreRules(BOOK_PRIORITY_RULES),
    createTeamPriorityRule(teams),
  ];

  const totalPossiblePoints =
    COMMON_PRIORITY_RULES.length +
    getStatPriorityRules().length +
    BOOK_PRIORITY_RULES.length +
    teams.length * 5;

  const points = baseRules.reduce((sum, rule) => sum + rule(champion), 0);

  return totalPossiblePoints === 0 ? 0 : points / totalPossiblePoints;
}

export function sortByBookPriorityDesc(
  champions: IChampion[],
  teams: ITeam[],
  rarity: ChampionRarity
): IChampion[] {
  return champions
    .map((c) => ({
      champion: c,
      priority: getBookPriority(c, teams),
    }))
    .filter((c) => !c.champion.is_booked && c.champion.rarity === rarity)
    .filter((c) => c.champion.is_book_needed)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(({ champion }) => champion);
}
