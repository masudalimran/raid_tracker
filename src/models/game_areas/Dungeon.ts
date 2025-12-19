export const DUNGEON = {
  SPIDER: "Spider",
  SPIDER_HARD: "Spider Hard",
  DRAGON: "Dragon",
  DRAGON_HARD: "Dragon Hard",
  ICE_GOLEM: "Ice Golem",
  ICE_GOLEM_HARD: "Ice Golem Hard",
  FIRE_KNIGHT: "Fire Knight",
  FIRE_KNIGHT_HARD: "Fire Knight Hard",
  SAND_DEVIL: "Sand Devil",
  SHOGUN: "Shogun",
  IRON_TWIN: "Iron Twin",
} as const;

export type DUNGEON = (typeof DUNGEON)[keyof typeof DUNGEON];
