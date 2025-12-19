// helpers/sort.ts

import type IChampion from "../models/IChampion";

export function sortBySpeedDesc(champions: IChampion[]): IChampion[] {
  return [...champions].sort((a, b) => b.spd - a.spd);
}
