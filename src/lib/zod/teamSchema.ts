import { z } from "zod";
import {
  TEAM_IDENTIFIERS,
  type TeamIdentifier,
} from "../../data/team_priority_weight";

export const teamSchema = z.object({
  // team_name: z.string().min(1, "Invalid Team Name"),
  team_name: z.custom<TeamIdentifier>(
    (value) => TEAM_IDENTIFIERS.includes(value as TeamIdentifier),
    { message: "Invalid team name" }
  ),

  champion_ids: z.array(z.string()).min(1, "At least one champion is required"),

  clearing_stage: z.string().min(1, "Clearing stage is required"),

  notes: z.string().optional(),

  user_id: z.string().uuid(),
  rsl_account_id: z.string().uuid(),
});

export type TeamFormData = z.infer<typeof teamSchema>;
