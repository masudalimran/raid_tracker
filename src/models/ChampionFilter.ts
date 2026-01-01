import type IChampion from "./IChampion";

export type SortOrder = "asc" | "desc";
export type FilterStat = keyof IChampion | "book_priority" | "mastery_priority";

export interface ChampionFilter {
  stat: FilterStat;
  type: string;
  faction: string;
  rarity: string;
  sortOrder: SortOrder;
}
