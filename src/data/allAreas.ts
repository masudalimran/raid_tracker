import { POTION_KEEP } from "../models/game_areas/PotionKeep";
import { DUNGEON } from "../models/game_areas/Dungeon";
import { CLAN_BOSS } from "../models/game_areas/ClanBoss";
import { HYDRA } from "../models/game_areas/Hydra";
import { ARENA } from "../models/game_areas/Arena";
import { DOOM_TOWER_BOSS } from "../models/game_areas/DoomTowerBoss";
import { ChampionFaction } from "../models/ChampionFaction";
import toSlug from "../helpers/toSlug";

export interface GameArea {
  key: string;
  name: string;
  path: string;
  group: string;
}

const grouped = (source: Record<string, string>, group: string) =>
  Object.entries(source).map(([key, name]) => ({ key, name, path: toSlug(key), group }));

// Every routable game area, flattened — shared by anything that needs to scan
// or link to all team pages at once (Home's attention widget, global search).
// Group names mirror the sidebar section labels so the two stay in sync.
export const ALL_AREAS: GameArea[] = [
  ...grouped(POTION_KEEP, "Potion Keeps"),
  ...grouped(DUNGEON, "Dungeons"),
  ...grouped(CLAN_BOSS, "Clan Boss"),
  ...grouped(HYDRA, "Hydra"),
  ...grouped(ARENA, "Arena"),
  ...grouped(DOOM_TOWER_BOSS, "Doom Tower"),
  ...grouped(ChampionFaction, "Faction Wars"),
];
