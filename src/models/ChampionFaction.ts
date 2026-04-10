export const ChampionFaction = {
  ARGONITES: "Argonites",
  BANNER_LORDS: "Banner Lords",
  BARBARIANS: "Barbarians",
  DARK_ELVES: "Dark Elves",
  DEMON_SPAWNS: "Demon Spawns",
  DWARVES: "Dwarves",
  HIGH_ELVES: "High Elves",
  KNIGHTS_REVENANT: "Knights Revenant",
  LIZARDMEN: "Lizardmen",
  OGRYN_TRIBES: "Ogryn Tribes",
  ORCS: "Orcs",
  SACRED_ORDER: "Sacred Order",
  SHADOWKINS: "Shadowkins",
  SKIN_WALKERS: "Skin Walkers",
  SYLVAN_WATCHERS: "Sylvan Watchers",
  UNDEAD_HORDES: "Undead Hordes",
} as const;

export type ChampionFaction =
  (typeof ChampionFaction)[keyof typeof ChampionFaction];
