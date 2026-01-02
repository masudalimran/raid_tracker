import toSlug from "../helpers/toSlug";
import { ChampionFaction } from "../models/ChampionFaction";
import { ARENA } from "../models/game_areas/Arena";
import { CLAN_BOSS } from "../models/game_areas/ClanBoss";
import { DOOM_TOWER_BOSS } from "../models/game_areas/DoomTowerBoss";
import { DUNGEON } from "../models/game_areas/Dungeon";
import { HYDRA } from "../models/game_areas/Hydra";
import { POTION_KEEP } from "../models/game_areas/PotionKeep";

// Helper to convert an object like DOOM_TOWER_BOSS → slug keys with default weight
const mapWithWeight = (
  obj: Record<string, string>,
  weight: number,
  hardWeight?: number
) => {
  return Object.values(obj).reduce((acc, name) => {
    const key = toSlug(name);
    acc[key] =
      name.includes("Hard") && hardWeight !== undefined ? hardWeight : weight;
    return acc;
  }, {} as Record<string, number>);
};

export type TeamIdentifier = string;

export const TEAM_PRIORITY_WEIGHTS: Record<TeamIdentifier, number> = {
  // Potion Keep
  ...mapWithWeight(POTION_KEEP, 10),

  // Dungeons
  ...mapWithWeight(DUNGEON, 45, 5),

  // Clan Boss
  ...mapWithWeight(CLAN_BOSS, 50), // Demon Lord = 55, Chimera = 50; we can override below
  demon_lord: 55, // specific override

  // Hydra
  ...mapWithWeight(HYDRA, 15),

  // Arena
  ...mapWithWeight(ARENA, 35, 35), // classic = 40 override below
  classic_arena: 40, // override

  // Champion Factions
  ...mapWithWeight(ChampionFaction, 20),

  // Doom Tower Boss
  ...mapWithWeight(DOOM_TOWER_BOSS, 30, 5),
};

export const TEAM_IDENTIFIERS = Object.keys(
  TEAM_PRIORITY_WEIGHTS
) as TeamIdentifier[];
