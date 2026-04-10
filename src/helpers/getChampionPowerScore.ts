import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { ChampionRarity } from "../models/ChampionRarity";
import { getTeamScore, getStatScore } from "./sortChampions";
import { fetchTeams } from "./handleTeams";
import { TEAM_PRIORITY_WEIGHTS } from "../data/team_priority_weight";

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

  STAT_QUALITY: 200, // getStatScore returns 0–1; 200 = perfectly built for role
  BOOKED: 200,
  MASTERY: 120,

  ROLE: 40,

  BUILT_BASE: 50, // proportional ramp: (level / 60) * BUILT_BASE — no cliff

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
   * 2️⃣ STAT QUALITY — role-aware, sourced from sortChampions
   */
  power += getStatScore(champion) * WEIGHTS.STAT_QUALITY;

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
   * 5️⃣ BUILT STATUS — smooth ramp from 0 to BUILT_BASE across levels 1–60
   */
  power += (champion.level / 60) * WEIGHTS.BUILT_BASE;

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
 * NORMALIZATION
 * -----------------------------
 * Scales raw scores to a 0–1000 range relative to the current roster,
 * so differences between champions are always perceivable.
 */
const normalizeToScale = (raw: number, min: number, max: number): number => {
  const range = max - min;
  if (range === 0) return 50;
  return Math.round(((raw - min) / range) * 10000) / 100; // 2dp precision
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

  const scored = champions.map((champion) => ({
    champion,
    raw: calculateChampionPower(champion, teams),
  }));

  const raws = scored.map((s) => s.raw);
  const min = Math.min(...raws);
  const max = Math.max(...raws);

  return scored
    .map(({ champion, raw }) => ({
      ...champion,
      champion_impact: normalizeToScale(raw, min, max),
    }))
    .sort((a, b) => (b.champion_impact ?? 0) - (a.champion_impact ?? 0));
};

/**
 * Returns the percentage of weighted content areas covered by teams (0–100).
 * Each area contributes its TEAM_PRIORITY_WEIGHT when at least one team exists for it.
 * A score of 100% means every possible content area has a team.
 */
export const getAccountCoverage = async (): Promise<number> => {
  const teams = await fetchTeams();

  const totalPossibleWeight = Object.values(TEAM_PRIORITY_WEIGHTS).reduce(
    (a, b) => a + b,
    0
  );

  if (totalPossibleWeight === 0) return 0;

  const coveredAreas = new Set(teams.map((t) => t.team_name));
  const coveredWeight = [...coveredAreas].reduce(
    (total, name) => total + (TEAM_PRIORITY_WEIGHTS[name] ?? 0),
    0
  );

  return Math.round((coveredWeight / totalPossibleWeight) * 10000) / 100; // 2dp precision
};
