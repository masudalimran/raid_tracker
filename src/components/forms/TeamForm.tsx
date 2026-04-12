import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamSchema, type TeamFormData } from "../../lib/zod/teamSchema";
import type IChampion from "../../models/IChampion";
import ChampionMultiSelect from "./inputs/ChampionMultiSelect";
import type ITeam from "../../models/ITeam";
import toSlug from "../../helpers/toSlug";
import { useTeam } from "../../hooks/useTeam";
import { type TeamIdentifier } from "../../data/team_priority_weight";

interface TeamFormProps {
  maxChampions?: number;
  teamName: TeamIdentifier;
  championList: IChampion[];
  team?: Partial<ITeam>;
  onCancel: () => void;
  onSave: () => void;
}

export default function TeamForm({
  maxChampions = 4,
  teamName,
  championList = [],
  team,
  onCancel,
  onSave,
}: TeamFormProps) {
  const { addTeam, updateTeam, loading } = useTeam();

  teamName = toSlug(teamName);

  const { id: userId } = JSON.parse(
    localStorage.getItem("supabase_auth") || "{}",
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return null;

  const rslAccountId = current_rsl_account.id;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      team_name: teamName,
      champion_ids: [],
      clearing_stage: "",
      notes: "",
      user_id: userId,
      rsl_account_id: rslAccountId,
      ...team,
    },
  });

  const supabase_teams = JSON.parse(
    localStorage.getItem("supabase_team_list") || "[]",
  ) as ITeam[];

  const onSubmit = async (data: TeamFormData) => {
    if (team?.id) {
      await updateTeam(team.id.toString(), data)
        .then((res) => {
          const updatedTeams = supabase_teams.map((c: ITeam) =>
            c.id === team.id ? { ...c, ...res } : c,
          );
          localStorage.setItem("supabase_team_list", JSON.stringify(updatedTeams));
        })
        .catch((error) => console.error("Error updating team:", error));
    } else {
      await addTeam(data)
        .then((res) => {
          supabase_teams.push(res);
          localStorage.setItem("supabase_team_list", JSON.stringify(supabase_teams));
        })
        .catch((error) => console.error("Error adding team:", error));
    }
    onSave();
  };

  const handleImportNoHardTeam = () => {
    if (teamName.includes("_hard")) {
      const currentUserTeams = supabase_teams.filter(
        (t) => t.user_id === userId && t.rsl_account_id === rslAccountId,
      );
      const nonHardTeam = currentUserTeams.find(
        (t) => t.team_name === teamName.replace("_hard", ""),
      );
      if (nonHardTeam) {
        reset({
          team_name: teamName,
          champion_ids: [...nonHardTeam.champion_ids],
          clearing_stage: nonHardTeam.clearing_stage,
          notes: nonHardTeam.notes,
          user_id: userId,
          rsl_account_id: rslAccountId,
          ...team,
        });
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-h-[75vh] overflow-auto space-y-4 pt-1"
    >
      {teamName.includes("_hard") && (
        <button
          type="button"
          className="text-xs text-amber-600 hover:text-amber-700 font-medium underline cursor-pointer"
          onClick={handleImportNoHardTeam}
        >
          Import from Normal Mode team →
        </button>
      )}

      {/* Clearing Stage */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Clearing Stage
        </label>
        <input
          {...register("clearing_stage")}
          className="input"
          placeholder="E.g. Stage 16, Gold, 1-KEY HARD, MAX"
        />
        <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500 space-y-0.5">
          <p className="font-medium text-gray-600">Format examples:</p>
          <ul className="space-y-0.5 list-disc ml-4">
            <li>Dungeons: Stage 16, Stage 20, Stage 25(MAX)</li>
            <li>Demon Lord: 1-KEY HARD, 2-KEY ULTRA-NIGHTMARE</li>
            <li>Faction Wars: Stage 7, Stage 21(MAX)</li>
            <li>Classic Arena: Silver III, Gold IV, Platinum</li>
            <li>Hydra: 1-KEY BRUTAL, 1-KEY NIGHTMARE</li>
          </ul>
        </div>
        {errors.clearing_stage && (
          <p className="text-red-500 text-xs mt-1">{errors.clearing_stage.message}</p>
        )}
        {errors.team_name && (
          <p className="text-red-500 text-xs mt-1">{errors.team_name.message}</p>
        )}
      </div>

      {/* Champions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Champions
        </label>
        <Controller
          control={control}
          name="champion_ids"
          render={({ field }) => (
            <ChampionMultiSelect
              value={field.value}
              onChange={field.onChange}
              champions={championList}
              max={maxChampions}
            />
          )}
        />
        {errors.champion_ids && (
          <p className="text-red-500 text-xs mt-1">{errors.champion_ids.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Notes
        </label>
        <textarea
          {...register("notes")}
          className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-400 transition
                     resize-none"
          rows={3}
          placeholder="Optional notes about this team setup…"
        />
      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register("team_name")} value={teamName} />
      <input type="hidden" {...register("user_id")} value={userId} />
      <input type="hidden" {...register("rsl_account_id")} value={rslAccountId} />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          {loading ? "Saving…" : "Save Team"}
        </button>
      </div>
    </form>
  );
}
