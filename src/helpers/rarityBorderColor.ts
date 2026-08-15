import { ChampionRarity } from "../models/ChampionRarity";

/** Border-color classes for relic/blessing thumbnails — distinct from colorByRarity (which returns a background tint, invisible once an image fully covers its frame). */
export const RARITY_BORDER_COLOR: Record<string, string> = {
  [ChampionRarity.MYTHICAL]: "border-red-400",
  [ChampionRarity.LEGENDARY]: "border-orange-400",
  [ChampionRarity.EPIC]: "border-purple-400",
  [ChampionRarity.RARE]: "border-blue-400",
  [ChampionRarity.UNCOMMON]: "border-green-400",
  [ChampionRarity.COMMON]: "border-gray-400",
};
