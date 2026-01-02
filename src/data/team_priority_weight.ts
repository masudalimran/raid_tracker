import { ChampionFaction } from "../models/ChampionFaction";
import { ARENA } from "../models/game_areas/Arena";
import { CLAN_BOSS } from "../models/game_areas/ClanBoss";
import { DOOM_TOWER_BOSS } from "../models/game_areas/DoomTowerBoss";
import { DUNGEON } from "../models/game_areas/Dungeon";
import { HYDRA } from "../models/game_areas/Hydra";
import { POTION_KEEP } from "../models/game_areas/PotionKeep";

export type TeamIdentifier =
  | POTION_KEEP
  | DUNGEON
  | CLAN_BOSS
  | HYDRA
  | ARENA
  | ChampionFaction
  | DOOM_TOWER_BOSS;

export const TEAM_PRIORITY_WEIGHTS: Record<TeamIdentifier, number> = {
  [POTION_KEEP.ARCANE_POTION]: 10,
  [POTION_KEEP.SPIRIT_POTION]: 10,
  [POTION_KEEP.VOID_POTION]: 10,
  [POTION_KEEP.FORCE_POTION]: 10,

  [DUNGEON.SPIDER]: 45,
  [DUNGEON.SPIDER_HARD]: 5,
  [DUNGEON.DRAGON]: 45,
  [DUNGEON.DRAGON_HARD]: 5,
  [DUNGEON.ICE_GOLEM]: 45,
  [DUNGEON.ICE_GOLEM_HARD]: 5,
  [DUNGEON.FIRE_KNIGHT]: 45,
  [DUNGEON.FIRE_KNIGHT_HARD]: 5,
  [DUNGEON.SAND_DEVIL]: 45,
  [DUNGEON.SHOGUN]: 45,
  [DUNGEON.IRON_TWIN]: 45,

  [CLAN_BOSS.DEMON_LORD]: 55,
  [CLAN_BOSS.CHIMERA]: 50,

  [HYDRA.HYDRA_A]: 15,
  [HYDRA.HYDRA_B]: 15,
  [HYDRA.HYDRA_C]: 15,

  [ARENA.CLASSIC_ARENA]: 40,
  [ARENA.TAG_ARENA_A]: 35,
  [ARENA.TAG_ARENA_B]: 35,
  [ARENA.TAG_ARENA_C]: 35,

  [ChampionFaction.BANNER_LORDS]: 20,
  [ChampionFaction.HIGH_ELVES]: 20,
  [ChampionFaction.SACRED_ORDER]: 20,
  [ChampionFaction.BARBARIANS]: 20,
  [ChampionFaction.OGRYN_TRIBES]: 20,
  [ChampionFaction.LIZARDMEN]: 20,
  [ChampionFaction.SKIN_WALKERS]: 20,
  [ChampionFaction.ORCS]: 20,
  [ChampionFaction.DEMON_SPAWNS]: 20,
  [ChampionFaction.UNDEAD_HORDES]: 20,
  [ChampionFaction.DARK_ELVES]: 20,
  [ChampionFaction.KNIGHTS_REVENANT]: 20,
  [ChampionFaction.DWARVES]: 20,
  [ChampionFaction.SHADOWKINS]: 20,
  [ChampionFaction.SYLVAN_WATCHERS]: 20,

  [DOOM_TOWER_BOSS.SCARAB_KING]: 30,
  [DOOM_TOWER_BOSS.SCARAB_KING_HARD]: 5,
  [DOOM_TOWER_BOSS.MAGMA_DRAGON]: 30,
  [DOOM_TOWER_BOSS.MAGMA_DRAGON_HARD]: 5,
  [DOOM_TOWER_BOSS.NETHER_SPIDER]: 30,
  [DOOM_TOWER_BOSS.NETHER_SPIDER_HARD]: 5,
  [DOOM_TOWER_BOSS.GRYPHON]: 30,
  [DOOM_TOWER_BOSS.GRYPHON_HARD]: 5,
  [DOOM_TOWER_BOSS.BOMMAL]: 30,
  [DOOM_TOWER_BOSS.BOMMAL_HARD]: 5,
  [DOOM_TOWER_BOSS.DARK_FAE]: 30,
  [DOOM_TOWER_BOSS.DARK_FAE_HARD]: 5,
  [DOOM_TOWER_BOSS.ETERNAL_DRAGON]: 30,
  [DOOM_TOWER_BOSS.ETERNAL_DRAGON_HARD]: 5,
  [DOOM_TOWER_BOSS.FROST_SPIDER]: 30,
  [DOOM_TOWER_BOSS.FROST_SPIDER_HARD]: 5,
};

export const TEAM_IDENTIFIERS = Object.keys(
  TEAM_PRIORITY_WEIGHTS
) as TeamIdentifier[];
