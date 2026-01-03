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
    localStorage.getItem("supabase_auth") || "{}"
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]"
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
    localStorage.getItem("supabase_team_list") || "[]"
  ) as ITeam[];

  const onSubmit = async (data: TeamFormData) => {
    if (team?.id) {
      await updateTeam(team.id.toString(), data)
        .then((res) => {
          const updatedTeams = supabase_teams.map((c: ITeam) =>
            c.id === team.id ? { ...c, ...res } : c
          );
          localStorage.setItem(
            "supabase_team_list",
            JSON.stringify(updatedTeams)
          );
        })
        .catch((error) => {
          console.error("Error updating team:", error);
        });
    } else {
      await addTeam(data)
        .then((res) => {
          supabase_teams.push(res);
          localStorage.setItem(
            "supabase_team_list",
            JSON.stringify(supabase_teams)
          );
        })
        .catch((error) => {
          console.error("Error adding team:", error);
        });
    }

    onSave();
  };

  const handleImportNoHardTeam = () => {
    if (teamName.includes("_hard")) {
      const currentUserTeams = supabase_teams.filter(
        (team) =>
          team.user_id === userId && team.rsl_account_id === rslAccountId
      );
      const nonHardTeam = currentUserTeams.find(
        (team) => team.team_name === teamName.replace("_hard", "")
      );
      if (nonHardTeam) {
        console.log(nonHardTeam);
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
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white max-h-[80vh] overflow-auto px-8 border-t-2 pt-2"
      >
        {teamName.includes("_hard") && (
          <div>
            <button
              type="button"
              className="text-blue-400 underline cursor-pointer hover:text-blue-800"
              onClick={handleImportNoHardTeam}
            >
              Import Non-Hard Mode Team
            </button>
          </div>
        )}
        {/* Clearing Stage */}
        <div className="mb-3">
          <label className="font-medium">Clearing Stage</label>
          <input {...register("clearing_stage")} className="input" />
          {errors.clearing_stage && (
            <p className="text-red-500">{errors.clearing_stage.message}</p>
          )}
          {errors.team_name && (
            <p className="text-red-500">{errors.team_name.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="font-medium">Champions</label>

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
            <p className="text-red-500 text-sm mt-1">
              {errors.champion_ids.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="mb-3">
          <label className="font-medium">Notes</label>
          <textarea
            {...register("notes")}
            className="w-full border px-2 py-1 rounded"
            rows={3}
          />
        </div>

        {/* Hidden fields */}
        <input type="hidden" {...register("team_name")} value={teamName} />
        <input type="hidden" {...register("user_id")} value={userId} />
        <input
          type="hidden"
          {...register("rsl_account_id")}
          value={rslAccountId}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer border border-gray-500 hover:bg-gray-600 transition text-gray-500 hover:text-white px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
          >
            {loading ? "Saving" : "Save"} Team
          </button>
        </div>
      </form>
    </>
  );
}
