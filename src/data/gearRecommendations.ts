// NOT CURRENTLY IN USE — retained for potential future re-enabling.
/**
 * Recommended gear set combinations per champion role and type.
 * Sets are listed by their display names (matching gearSetMap.ts).
 * First entry = primary recommendation, second = alternative build.
 */

import { ChampionRole } from "../models/ChampionRole";
import { ChampionType } from "../models/ChampionType";

export interface SetCombo {
  sets: string[];   // display names from gearSetMap, e.g. ["Speed", "Accuracy"]
  note?: string;    // optional context
}

// ── Role-based recommendations ────────────────────────────────────────────────

export const ROLE_GEAR_RECS: Partial<Record<ChampionRole, SetCombo[]>> = {
  [ChampionRole.NUKER]: [
    { sets: ["Savage", "Cruel"],   note: "Ignore DEF" },
    { sets: ["Lethal", "Speed"],   note: "Crit DMG" },
  ],
  [ChampionRole.MAX_HP_DPS]: [
    { sets: ["Destroy", "Speed"],  note: "Max HP shred" },
    { sets: ["Savage", "Speed"] },
  ],
  [ChampionRole.POISONER]: [
    { sets: ["Toxic", "Lifesteal"] },
    { sets: ["Toxic", "Speed"] },
  ],
  [ChampionRole.HP_BURNER]: [
    { sets: ["Immortal", "Lifesteal"] },
    { sets: ["Immortal", "Speed"] },
  ],
  [ChampionRole.DEBUFFER]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Perception"] },
  ],
  [ChampionRole.TM_REDUCER]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Perception"] },
  ],
  [ChampionRole.SPEED_BOOSTER]: [
    { sets: ["Speed", "Immunity"] },
    { sets: ["Speed", "Accuracy"] },
  ],
  [ChampionRole.BUFFER]: [
    { sets: ["Speed", "Immunity"] },
    { sets: ["Speed", "Resist"] },
  ],
  [ChampionRole.HEALER]: [
    { sets: ["Immortal", "Speed"] },
    { sets: ["Regeneration", "Speed"] },
  ],
  [ChampionRole.REVIVER]: [
    { sets: ["Immortal", "Speed"] },
    { sets: ["Regeneration", "Speed"] },
  ],
  [ChampionRole.CLEANSER]: [
    { sets: ["Speed", "Immunity"] },
    { sets: ["Speed", "Resist"] },
  ],
  [ChampionRole.CONTROL]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Perception"] },
  ],
  [ChampionRole.UNKILLABLE]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Stoneskin"],         note: "6-piece" },
  ],
  [ChampionRole.BLOCK_BUFF]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Perception"] },
  ],
  [ChampionRole.PROVOKER]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Taunting", "Speed"] },
  ],
  [ChampionRole.LEECH]: [
    { sets: ["Lifesteal", "Speed"] },
    { sets: ["Immortal", "Speed"] },
  ],
  [ChampionRole.SHIELDER]: [
    { sets: ["Speed", "Immunity"] },
    { sets: ["Shield", "Speed"] },
  ],
  [ChampionRole.SLEEP_DEBUFFER]: [
    { sets: ["Speed", "Accuracy"] },
    { sets: ["Perception"] },
  ],
  [ChampionRole.ARENA]: [
    { sets: ["Savage", "Speed"] },
    { sets: ["Lethal", "Speed"] },
  ],
  [ChampionRole.HYDRA]: [
    { sets: ["Lifesteal", "Speed"] },
    { sets: ["Immortal", "Accuracy"] },
  ],
  [ChampionRole.DEMON_LORD]: [
    { sets: ["Lifesteal", "Speed"] },
    { sets: ["Immortal", "Speed"] },
  ],
  [ChampionRole.BOSS_KILLER]: [
    { sets: ["Savage", "Cruel"] },
    { sets: ["Lethal", "Speed"] },
  ],
  [ChampionRole.CHIMERA]: [
    { sets: ["Lifesteal", "Speed"] },
    { sets: ["Immortal", "Accuracy"] },
  ],
};

// ── Type-based fallbacks (used when champion has no roles tagged) ─────────────

export const TYPE_GEAR_RECS: Partial<Record<string, SetCombo[]>> = {
  [ChampionType.ATTACK]: [
    { sets: ["Offense", "Speed"] },
    { sets: ["Savage", "Speed"] },
  ],
  [ChampionType.DEFENSE]: [
    { sets: ["Defense", "Speed"] },
    { sets: ["Shield", "Speed"] },
  ],
  [ChampionType.HP]: [
    { sets: ["Life", "Speed"] },
    { sets: ["Immortal", "Speed"] },
  ],
  [ChampionType.SUPPORT]: [
    { sets: ["Speed", "Immunity"] },
    { sets: ["Speed", "Accuracy"] },
  ],
};
