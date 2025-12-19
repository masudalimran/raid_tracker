export const ChampionFaction = {
  BANNER_LORDS: "Banner Lords",
  HIGH_ELVES: "High Elves",
  SACRED_ORDER: "Sacred Order",
  BARBARIANS: "Barbarians",
  OGRYN_TRIBES: "Ogryn Tribes",
  LIZARDMEN: "Lizardmen",
  SKIN_WALKERS: "Skin Walkers",
  ORCS: "Orcs",
  DEMON_SPAWNS: "Demon Spawns",
  UNDEAD_HORDES: "Undead Hordes",
  DARK_ELVES: "Dark Elves",
  KNIGHTS_REVENANT: "Knights Revenant",
  DWARVES: "Dwarves",
  SHADOWKINS: "Shadowkins",
  SYLVAN_WATCHERS: "Sylvan Watchers",
} as const;

export type ChampionFaction =
  (typeof ChampionFaction)[keyof typeof ChampionFaction];
