import { supabase } from "../lib/supabaseClient";
import { ChampionRarity } from "../models/ChampionRarity";
import type IChampion from "../models/IChampion";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";
import { sortChampionsByPowerDesc } from "./getChampionPowerScore";
import { sortByLevelDesc } from "./sortChampions";

export const fetchChampions = async (): Promise<IChampion[]> => {
  let championList: IChampion[] = [];
  const supabase_champion_list = localStorage.getItem("supabase_champion_list");

  if (supabase_champion_list) {
    championList = JSON.parse(supabase_champion_list) as IChampion[];
  } else {
    const { data, error } = await supabase.from("champions").select("*");

    if (error) {
      console.error(error);
    } else {
      championList = data as IChampion[];
      localStorage.setItem("supabase_champion_list", JSON.stringify(data));
    }
  }
  return championList;
};

export const generateChampions = async () => {
  let supabase_champion_list = JSON.parse(
    localStorage.getItem("supabase_champion_list") ?? "[]"
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]"
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return [];

  supabase_champion_list = [...supabase_champion_list].filter(
    (champion: IChampion) => champion.rsl_account_id === current_rsl_account.id
  );

  const mythical_champions = supabase_champion_list.filter(
    (champion: IChampion) => champion.rarity === ChampionRarity.MYTHICAL
  );
  const legendary_champions = supabase_champion_list.filter(
    (champion: IChampion) => champion.rarity === ChampionRarity.LEGENDARY
  );
  const epic_champions = supabase_champion_list.filter(
    (champion: IChampion) => champion.rarity === ChampionRarity.EPIC
  );
  const rare_champions = supabase_champion_list.filter(
    (champion: IChampion) => champion.rarity === ChampionRarity.RARE
  );
  const uncommon_champions = supabase_champion_list.filter(
    (champion: IChampion) => champion.rarity === ChampionRarity.UNCOMMON
  );
  const common_champions = supabase_champion_list.filter(
    (champion: IChampion) => champion.rarity === ChampionRarity.COMMON
  );

  const champions_sorted_by_rarity = [
    ...mythical_champions,
    ...legendary_champions,
    ...epic_champions,
    ...rare_champions,
    ...uncommon_champions,
    ...common_champions,
  ];

  const champions_that_are_built = sortByLevelDesc(
    [...champions_sorted_by_rarity].filter((champion: IChampion) =>
      checkIfChampionIsBuilt(champion)
    )
  );

  const champions_that_are_not_built = sortByLevelDesc(
    [...champions_sorted_by_rarity].filter(
      (champion: IChampion) => !checkIfChampionIsBuilt(champion)
    )
  );

  const sorted_champions = [
    ...champions_that_are_built,
    ...champions_that_are_not_built,
  ];

  // return sorted_champions;
  return await sortChampionsByPowerDesc(sorted_champions);
};
