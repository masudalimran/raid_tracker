import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";

export const getCurrentlyInUseChampions = (championList: IChampion[]) => {
  const supabase_team_list: ITeam[] = JSON.parse(
    localStorage.getItem("supabase_team_list") || "[]",
  );

  const usedChampionIds = new Set(
    supabase_team_list.flatMap((team) => team.champion_ids.map(String)),
  );

  return championList.filter((champion) =>
    usedChampionIds.has(String(champion.id)),
  );
};
