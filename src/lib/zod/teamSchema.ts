import { z } from "zod";

export const teamSchema = z.object({
  team_name: z.string().min(1, "Team name is required"),

  champion_ids: z.array(z.string()).min(1, "At least one champion is required"),

  clearing_stage: z.string().min(1, "Clearing stage is required"),

  notes: z.string().optional(),

  user_id: z.string().uuid(),
  rsl_account_id: z.string().uuid(),
});

export type TeamFormData = z.infer<typeof teamSchema>;
