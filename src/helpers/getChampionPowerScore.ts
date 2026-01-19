import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { ChampionRarity } from "../models/ChampionRarity";
import { getTeamScore } from "./sortChampions";
import { fetchTeams } from "./handleTeams";

/**
 * -----------------------------
 * TEAM SCORE (PRIMARY SIGNAL)
 * -----------------------------
 */

/**
 * -----------------------------
 * CONFIG — TUNE FREELY
 * -----------------------------
 */

const WEIGHTS = {
  TEAM_USAGE_MULTIPLIER: 1000, // makes team usage DOMINANT

  OPTIMAL_STAT: 25,
  BOOKED: 200,
  MASTERY: 120,

  ROLE: 40,

  BUILT_BASE: 50,

  LEVEL: 2,
  STAR: 10,
  ASCENSION: 8,
  AWAKEN: 12,

  RARITY: {
    [ChampionRarity.MYTHICAL]: 80,
    [ChampionRarity.LEGENDARY]: 60,
    [ChampionRarity.EPIC]: 40,
    [ChampionRarity.RARE]: 20,
    [ChampionRarity.UNCOMMON]: 5,
    [ChampionRarity.COMMON]: 0,
  },
};

/**
 * -----------------------------
 * OPTIMAL STAT TARGETS (Lv 60)
 * -----------------------------
 */
const OPTIMAL_STATS = {
  hp: 40000,
  atk: 3500,
  def: 3500,
  spd: 200,
  c_rate: 100,
  c_dmg: 200,
  acc: 250,
  res: 250,
};

/**
 * -----------------------------
 * STAT HELPERS
 * -----------------------------
 */

const isStatCloseToOptimal = (
  value: number,
  optimal: number,
  tolerance = 0.85
): boolean => value >= optimal * tolerance;

const countOptimalStats = (champion: IChampion): number => {
  let count = 0;

  if (isStatCloseToOptimal(champion.hp, OPTIMAL_STATS.hp)) count++;
  if (isStatCloseToOptimal(champion.atk, OPTIMAL_STATS.atk)) count++;
  if (isStatCloseToOptimal(champion.def, OPTIMAL_STATS.def)) count++;
  if (isStatCloseToOptimal(champion.spd, OPTIMAL_STATS.spd)) count++;
  if (isStatCloseToOptimal(champion.c_rate, OPTIMAL_STATS.c_rate)) count++;
  if (isStatCloseToOptimal(champion.c_dmg, OPTIMAL_STATS.c_dmg)) count++;
  if (isStatCloseToOptimal(champion.acc, OPTIMAL_STATS.acc)) count++;
  if (isStatCloseToOptimal(champion.res, OPTIMAL_STATS.res)) count++;

  return count;
};

/**
 * -----------------------------
 * POWER CALCULATION
 * -----------------------------
 */

export const calculateChampionPower = (
  champion: IChampion,
  teams: ITeam[]
): number => {
  let power = 0;

  /**
   * 1️⃣ TEAM USAGE — ABSOLUTE PRIORITY
   */
  const teamScore = getTeamScore(champion, teams);
  power += teamScore * WEIGHTS.TEAM_USAGE_MULTIPLIER;

  /**
   * 2️⃣ STAT QUALITY
   */
  const optimalStats = countOptimalStats(champion);
  power += optimalStats * WEIGHTS.OPTIMAL_STAT;

  /**
   * 3️⃣ BOOKS & MASTERIES (Books > Mastery)
   */
  if (!champion.is_book_needed && champion.is_booked) {
    power += WEIGHTS.BOOKED;
  }

  if (!champion.is_mastery_needed && champion.has_mastery) {
    power += WEIGHTS.MASTERY;
  }

  /**
   * 4️⃣ ROLE FLEXIBILITY
   */
  power += champion.role.length * WEIGHTS.ROLE;

  /**
   * 5️⃣ BUILT STATUS
   */
  if (champion.level >= 50) {
    power += WEIGHTS.BUILT_BASE;
  }

  /**
   * 6️⃣ PROGRESSION (Tie-breakers)
   */
  power += champion.level * WEIGHTS.LEVEL;
  power += champion.stars * WEIGHTS.STAR;
  power += champion.ascension_stars * WEIGHTS.ASCENSION;
  power += champion.awaken_stars * WEIGHTS.AWAKEN;

  /**
   * 7️⃣ RARITY (Lowest priority)
   */
  power += WEIGHTS.RARITY[champion.rarity] ?? 0;

  return Math.round(power);
};

/**
 * -----------------------------
 * SORTING (ASYNC)
 * -----------------------------
 */
export const sortChampionsByPowerDesc = async (
  champions: IChampion[]
): Promise<IChampion[]> => {
  const teams = await fetchTeams();

  return [...champions]
    .map((champion) => ({
      ...champion,
      champion_impact: calculateChampionPower(champion, teams),
    }))
    .sort((a, b) => (b.champion_impact ?? 0) - (a.champion_impact ?? 0));
};
