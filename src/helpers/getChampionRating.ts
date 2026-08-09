import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { ChampionRole } from "../models/ChampionRole";
import { ChampionType } from "../models/ChampionType";
import { getStatScore, getTeamScore } from "./sortChampions";

/**
 * Single-letter archetype tag shown next to the numeric rating, e.g. "7.2/10 (C)".
 * Derived from `champion.type` rather than roles — every champion has exactly
 * one type, so there's no "which role is the real one" ambiguity to resolve.
 */
export type ChampionArchetype = "C" | "S" | "T" | "H";

const ARCHETYPE_BY_TYPE: Partial<Record<ChampionType, ChampionArchetype>> = {
  [ChampionType.ATTACK]: "C",  // Carry — primary damage dealer
  [ChampionType.SUPPORT]: "S", // Support — buffs/heals/utility
  [ChampionType.DEFENSE]: "T", // Tank — front-line, soaks hits
  [ChampionType.HP]: "H",      // Bulky — HP-stacked sustain/damage
  // ChampionType.OTHER intentionally has no archetype — nothing to infer yet.
};

export const ARCHETYPE_LABEL: Record<ChampionArchetype, string> = {
  C: "Carry",
  S: "Support",
  T: "Tank",
  H: "Bulky",
};

// Roles that meaningfully swing a fight, independent of raw stats — same list
// Priority Queue uses to weight book/mastery urgency.
const HIGH_VALUE_ROLES: ChampionRole[] = [
  ChampionRole.POISONER,
  ChampionRole.HP_BURNER,
  ChampionRole.NUKER,
  ChampionRole.SPEED_BOOSTER,
  ChampionRole.TM_REDUCER,
  ChampionRole.REVIVER,
  ChampionRole.DEBUFFER,
  ChampionRole.BLOCK_BUFF,
  ChampionRole.UNKILLABLE,
  ChampionRole.CLEANSER,
  ChampionRole.PROVOKER,
];

// Cumulative team-weight (see TEAM_PRIORITY_WEIGHTS) at which "team usage"
// alone maxes out — roughly "core to 3 major pieces of content" (e.g. Clan
// Boss + Demon Lord + Arena). Tune freely.
const TEAM_USAGE_SATURATION = 150;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

function getTeamUsageScore(champion: IChampion, teams: ITeam[]): number {
  return clamp01(getTeamScore(champion, teams) / TEAM_USAGE_SATURATION);
}

// Level (vs. this champion's 10x-stars cap) carries the most weight, with
// book/mastery completion as secondary signals — "not needed" counts as
// already satisfied, matching checkIfChampionIsBuilt's own treatment of it.
function getProgressionScore(champion: IChampion): number {
  const maxLevel = (champion.stars || 6) * 10;
  const levelRatio = clamp01(champion.level / maxLevel);
  const bookScore = !champion.is_book_needed || champion.is_booked ? 1 : 0;
  const masteryScore = !champion.is_mastery_needed || champion.has_mastery ? 1 : 0;
  return levelRatio * 0.5 + bookScore * 0.25 + masteryScore * 0.25;
}

// How much this champion brings to a team by virtue of its role tags —
// majority credit for holding genuinely high-value roles, a smaller amount
// for general role breadth/flexibility.
function getRoleValueScore(champion: IChampion): number {
  const roles = champion.role ?? [];
  const highValueCount = roles.filter((r) => HIGH_VALUE_ROLES.includes(r)).length;
  return clamp01(
    (Math.min(highValueCount, 3) / 3) * 0.6 +
    (Math.min(roles.length, 6) / 6) * 0.4,
  );
}

export interface ChampionRatingBreakdown {
  /** 0–10, one decimal place. */
  score: number;
  archetype: ChampionArchetype | null;
  archetypeLabel: string | null;
  /** Each component is 0–1 — how much of that factor's full credit this champion earned. */
  teamUsage: number;
  progression: number;
  statQuality: number;
  roleValue: number;
}

/**
 * Composite 0–10 champion rating: how strong this champion actually is right
 * now, blending raw stat quality, progression (level/book/mastery), role
 * value, and — the biggest factor — how much weighted team usage it's
 * actually seeing. Team usage dominates because a maxed-out champion sitting
 * on the bench isn't delivering much account value yet.
 */
export function getChampionRating(champion: IChampion, teams: ITeam[]): ChampionRatingBreakdown {
  const teamUsage = getTeamUsageScore(champion, teams);
  const progression = getProgressionScore(champion);
  const statQuality = getStatScore(champion);
  const roleValue = getRoleValueScore(champion);

  const composite =
    teamUsage * 0.35 +
    progression * 0.25 +
    statQuality * 0.2 +
    roleValue * 0.2;

  const score = Math.round(composite * 100) / 10;
  const archetype = ARCHETYPE_BY_TYPE[champion.type] ?? null;

  return {
    score,
    archetype,
    archetypeLabel: archetype ? ARCHETYPE_LABEL[archetype] : null,
    teamUsage,
    progression,
    statQuality,
    roleValue,
  };
}
