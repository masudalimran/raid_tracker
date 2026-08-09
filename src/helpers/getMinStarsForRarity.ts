import { ChampionRarity } from "../models/ChampionRarity";

/** Lowest star count a champion of this rarity can ever be — also used as the default when a champion is first created. */
export const RARITY_MIN_STARS: Record<ChampionRarity, number> = {
  [ChampionRarity.COMMON]: 1,
  [ChampionRarity.UNCOMMON]: 2,
  [ChampionRarity.RARE]: 3,
  [ChampionRarity.EPIC]: 4,
  [ChampionRarity.LEGENDARY]: 5,
  [ChampionRarity.MYTHICAL]: 6,
};

export function getMinStarsForRarity(rarity: string): number {
  return RARITY_MIN_STARS[rarity as ChampionRarity] ?? 1;
}
