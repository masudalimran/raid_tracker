export const DOOM_TOWER_BOSS = {
  SCARAB_KING: "Scarab King",
  SCARAB_KING_HARD: "Scarab King Hard",

  MAGMA_DRAGON: "Magma Dragon",
  MAGMA_DRAGON_HARD: "Magma Dragon Hard",

  NETHER_SPIDER: "Nether Spider",
  NETHER_SPIDER_HARD: "Nether Spider Hard",

  GRYPHON: "Gryphon",
  GRYPHON_HARD: "Gryphon Hard",

  BOMMAL: "Bommal",
  BOMMAL_HARD: "Bommal Hard",

  DARK_FAE: "Dark Fae",
  DARK_FAE_HARD: "Dark Fae Hard",

  ETERNAL_DRAGON: "Eternal Dragon",
  ETERNAL_DRAGON_HARD: "Eternal Dragon Hard",

  FROST_SPIDER: "Frost Spider",
  FROST_SPIDER_HARD: "Frost Spider Hard",
} as const;

export type DOOM_TOWER_BOSS =
  (typeof DOOM_TOWER_BOSS)[keyof typeof DOOM_TOWER_BOSS];
