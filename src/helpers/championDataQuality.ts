import DefaultChampionObject from "../components/forms/defaultChampionObject";
import { ChampionRole } from "../models/ChampionRole";
import type IChampion from "../models/IChampion";

// Shared with the Dev Champions page so the Home "Roster Health" widget and
// the /dev-champions filters always agree on what counts as an issue.
export const MIN_VIABLE_ROLES = 4;

export interface ChampionDataQualityCounts {
  defaultImage: number;
  noImage: number;
  underRoled: number;
  notViable: number;
}

export const getChampionDataQualityCounts = (
  champions: IChampion[],
): ChampionDataQualityCounts => {
  let defaultImage = 0;
  let noImage = 0;
  let underRoled = 0;
  let notViable = 0;

  for (const champion of champions) {
    if (!champion.imgUrl) noImage++;
    else if (champion.imgUrl === DefaultChampionObject.imgUrl) defaultImage++;

    if (champion.role?.includes(ChampionRole.NOT_VIABLE)) notViable++;
    else if ((champion.role?.length ?? 0) < MIN_VIABLE_ROLES) underRoled++;
  }

  return { defaultImage, noImage, underRoled, notViable };
};
