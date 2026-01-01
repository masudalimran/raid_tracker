import { ChampionAffinity } from "../models/ChampionAffinity";

export const colorByAffinity = (affinity: ChampionAffinity): string => {
  switch (affinity) {
    case ChampionAffinity.SPIRIT:
      return "bg-green-300";
      break;
    case ChampionAffinity.FORCE:
      return "bg-red-300";
      break;
    case ChampionAffinity.MAGIC:
      return "bg-blue-300";
      break;
    case ChampionAffinity.VOID:
      return "bg-purple-300";
      break;
    default:
      return "bg-gray-100";
      break;
  }
};

export default colorByAffinity;
