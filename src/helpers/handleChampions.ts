import { supabase } from "../lib/supabaseClient";
import { ChampionRarity } from "../models/ChampionRarity";
import type { Aura } from "../models/IChampion";
import type IChampion from "../models/IChampion";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";
import { sortChampionsByPowerDesc } from "./getChampionPowerScore";
import { sortByLevelDesc } from "./sortChampions";

/**
 * Utility to parse the stored `parsed_skills` string into `skills` array
 * and `parsed_aura` string into `aura` object
 */
const parseChampionData = (champion: IChampion): IChampion => {
  // Parse skills
  if (champion.parsed_skills && typeof champion.parsed_skills === "string") {
    try {
      champion.skills = JSON.parse(champion.parsed_skills);
    } catch (e) {
      console.error(`Failed to parse skills for champion ${champion.name}`, e);
      champion.skills = [];
    }
  } else {
    champion.skills = champion.skills ?? [];
  }

  // Parse aura
  if (champion.parsed_aura && typeof champion.parsed_aura === "string") {
    try {
      champion.aura = JSON.parse(champion.parsed_aura) as Aura;
    } catch (e) {
      console.error(`Failed to parse aura for champion ${champion.name}`, e);
      champion.aura = { effect: "", active_in: "All", effectiveness: "" };
    }
  } else {
    champion.aura = champion.aura ?? {
      effect: "",
      active_in: "All",
      effectiveness: "",
    };
  }

  return champion;
};

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

  // Parse skills and aura for all champions
  return championList.map(parseChampionData);
};

export const generateChampions = async (): Promise<IChampion[]> => {
  let supabase_champion_list: IChampion[] = JSON.parse(
    localStorage.getItem("supabase_champion_list") ?? "[]",
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return [];

  supabase_champion_list = [...supabase_champion_list]
    .filter((champion) => champion.rsl_account_id === current_rsl_account.id)
    .map(parseChampionData); // parse skills and aura here as well

  const mythical_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.MYTHICAL,
  );
  const legendary_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.LEGENDARY,
  );
  const epic_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.EPIC,
  );
  const rare_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.RARE,
  );
  const uncommon_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.UNCOMMON,
  );
  const common_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.COMMON,
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
    champions_sorted_by_rarity.filter((champion) =>
      checkIfChampionIsBuilt(champion),
    ),
  );

  const champions_that_are_not_built = sortByLevelDesc(
    champions_sorted_by_rarity.filter(
      (champion) => !checkIfChampionIsBuilt(champion),
    ),
  );

  const sorted_champions = [
    ...champions_that_are_built,
    ...champions_that_are_not_built,
  ];

  return await sortChampionsByPowerDesc(sorted_champions);
};
