import { ChampionRarity } from "../models/ChampionRarity";

export const colorByRarity = (rarity: ChampionRarity): string => {
  switch (rarity) {
    case ChampionRarity.MYTHICAL:
      return "bg-red-100";
      break;
    case ChampionRarity.LEGENDARY:
      return "bg-orange-300";
      break;
    case ChampionRarity.EPIC:
      return "bg-purple-300";
      break;
    case ChampionRarity.RARE:
      return "bg-blue-300";
      break;
    case ChampionRarity.UNCOMMON:
      return "bg-green-100";
      break;
    case ChampionRarity.COMMON:
      return "bg-gray-100";
      break;
    default:
      return "bg-gray-100";
      break;
  }
};

export default colorByRarity;
