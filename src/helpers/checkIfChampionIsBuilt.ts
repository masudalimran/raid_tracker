import { ChampionRole } from "../models/ChampionRole";
import type IChampion from "../models/IChampion";

export const checkIfChampionIsBuilt: (champion: IChampion) => boolean = (
  champion: IChampion
): boolean => {
  if (champion.role?.includes(ChampionRole.NUKER) && champion.level < 60)
    return false;
  if (champion.level < 50) return false;
  if (champion.is_book_needed && !champion.is_booked) return false;
  if (champion.is_mastery_needed && !champion.has_mastery) return false;
  if (champion.role?.includes(ChampionRole.DEBUFFER) && champion.spd < 180)
    return false;
  if (champion.spd < 160) return false;
  return true;
};
