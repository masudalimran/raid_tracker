import { buildAreaRoutes } from "../../helpers/buildAreaRoutes";
import { ChampionFaction } from "../../models/ChampionFaction";
import { ARENA } from "../../models/game_areas/Arena";
import { CLAN_BOSS } from "../../models/game_areas/ClanBoss";
import { DUNGEON } from "../../models/game_areas/Dungeon";
import { HYDRA } from "../../models/game_areas/Hydra";
import { POTION_KEEP } from "../../models/game_areas/PotionKeep";

export const AREA_ROUTES = [
  ...buildAreaRoutes(POTION_KEEP, {
    maxChampions: 5,
  }),

  ...buildAreaRoutes(DUNGEON, {
    maxChampions: 5,
  }),

  ...buildAreaRoutes(CLAN_BOSS, {
    maxChampions: 5,
  }),

  ...buildAreaRoutes(HYDRA, {
    maxChampions: 6,
  }),

  ...buildAreaRoutes(ARENA, {
    maxChampions: 4,
  }),

  ...buildAreaRoutes(ChampionFaction, {
    maxChampions: 5,
    isFaction: true,
  }),
] as const;
