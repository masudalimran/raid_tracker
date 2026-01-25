import type IChampion from "../models/IChampion";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";

export const getBuiltChampionsCount = (champions: IChampion[]): number => {
  return champions.filter(checkIfChampionIsBuilt).length;
};
