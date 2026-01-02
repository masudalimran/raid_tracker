import type { TeamIdentifier } from "../data/team_priority_weight";

export default interface ITeam {
  id: string;

  team_name: TeamIdentifier;
  champion_ids: string[];
  clearing_stage: string;
  notes: string;

  user_id?: string;
  rsl_account_id?: string;
}
