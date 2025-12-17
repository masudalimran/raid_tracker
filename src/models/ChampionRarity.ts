export const ChampionRarity = {
  MYTHICAL: "Mythical",
  LEGENDARY: "Legendary",
  EPIC: "Epic",
  RARE: "Rare",
  UNCOMMON: "Uncommon",
  COMMON: "Common",
} as const;

export type ChampionRarity =
  (typeof ChampionRarity)[keyof typeof ChampionRarity];
