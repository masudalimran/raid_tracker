import { supabase } from "../lib/supabaseClient";
import type ITeam from "../models/ITeam";
import toSlug from "./toSlug";

export const fetchTeams = async (): Promise<ITeam[]> => {
  let teamList: ITeam[] = [];
  const supabase_team_list = localStorage.getItem("supabase_team_list");

  if (supabase_team_list) {
    teamList = JSON.parse(supabase_team_list) as ITeam[];
  } else {
    const { data, error } = await supabase.from("teams").select("*");

    if (error) {
      console.error(error);
    } else {
      teamList = data as ITeam[];
      localStorage.setItem("supabase_team_list", JSON.stringify(data));
    }
  }

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]"
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return [];

  teamList = teamList.filter(
    (team) => team.rsl_account_id === current_rsl_account.id
  );

  return teamList;
};

export const fetchSingleTeam = async (
  team_name: string
): Promise<ITeam | undefined> => {
  let team = null;
  const teams = await fetchTeams();
  team = teams.find((team) => toSlug(team_name) == team.team_name);
  return team;
};
