import { buildAreaRoutes } from "../../helpers/buildAreaRoutes";
import { ChampionFaction } from "../../models/ChampionFaction";
import { ARENA } from "../../models/game_areas/Arena";
import { CLAN_BOSS } from "../../models/game_areas/ClanBoss";
import { DUNGEON } from "../../models/game_areas/Dungeon";
import { HYDRA } from "../../models/game_areas/Hydra";
import { POTION_KEEP } from "../../models/game_areas/PotionKeep";

export const AREA_ROUTES = [
  ...buildAreaRoutes(POTION_KEEP, {
    titleSuffix: "Team",
    maxChampions: 5,
  }),

  ...buildAreaRoutes(DUNGEON, {
    titleSuffix: "Team",
    maxChampions: 5,
  }),

  ...buildAreaRoutes(CLAN_BOSS, {
    titleSuffix: "Team",
    maxChampions: 5,
  }),

  ...buildAreaRoutes(HYDRA, {
    titleSuffix: "Team",
    maxChampions: 6,
  }),

  ...buildAreaRoutes(ARENA, {
    titleSuffix: "Team",
    maxChampions: 4,
  }),

  ...buildAreaRoutes(ChampionFaction, {
    titleSuffix: "Team",
    maxChampions: 5,
  }),
] as const;
