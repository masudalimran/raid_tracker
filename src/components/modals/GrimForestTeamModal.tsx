import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaMagic } from "react-icons/fa";
import Modal from "./Modal";
import ChampionMultiSelect from "../forms/inputs/ChampionMultiSelect";
import { useTeam } from "../../hooks/useTeam";
import { getTeamRequirements } from "../../data/areaRoleRequirements";
import { suggestGrimForestDecks } from "../../helpers/suggestGrimForestDecks";
import {
  GRIM_FOREST_DECK_1_SLUG,
  GRIM_FOREST_DECK_2_SLUG,
  GRIM_FOREST_DECK_SIZE,
} from "../../models/game_areas/GrimForest";
import type IChampion from "../../models/IChampion";
import type ITeam from "../../models/ITeam";

interface GrimForestFormData {
  clearing_stage: string;
  notes: string;
  deck1_champion_ids: string[];
  deck2_champion_ids: string[];
}

interface GrimForestTeamModalProps {
  deck1Team?: ITeam;
  deck2Team?: ITeam;
  champions: IChampion[];
  onClose: (shouldReload: boolean) => void;
}

/**
 * Both Grim Forest decks are edited together, not as two separate team
 * modals — they share one Clearing Stage/Notes (there's only one Grim Forest
 * progression per account) and a champion picked for one deck must disappear
 * from the other's picker, same cross-exclusion idea as Hydra's 3 heads.
 */
export default function GrimForestTeamModal({
  deck1Team,
  deck2Team,
  champions,
  onClose,
}: GrimForestTeamModalProps) {
  const { addTeam, updateTeam, loading } = useTeam();
  const requiredRoles = getTeamRequirements("GRIM_FOREST_DECK_1");
  const [saveError, setSaveError] = useState<string | null>(null);

  const { id: userId } = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  const { control, register, handleSubmit, setValue, watch } = useForm<GrimForestFormData>({
    defaultValues: {
      clearing_stage: deck1Team?.clearing_stage ?? deck2Team?.clearing_stage ?? "",
      notes: deck1Team?.notes ?? deck2Team?.notes ?? "",
      deck1_champion_ids: deck1Team?.champion_ids ?? [],
      deck2_champion_ids: deck2Team?.champion_ids ?? [],
    },
  });

  const deck1Ids = watch("deck1_champion_ids");
  const deck2Ids = watch("deck2_champion_ids");

  // Each deck's picker pool excludes whatever the *other* deck currently has
  // selected, but keeps its own picks visible — identical approach to Hydra.
  const deck1Pool = champions.filter((c) => !deck2Ids.includes(String(c.id)));
  const deck2Pool = champions.filter((c) => !deck1Ids.includes(String(c.id)));

  const suggestBothDecks = () => {
    const { deck1, deck2 } = suggestGrimForestDecks(champions, requiredRoles, GRIM_FOREST_DECK_SIZE);
    setValue("deck1_champion_ids", deck1.map((e) => e.champion.id!.toString()), { shouldDirty: true });
    setValue("deck2_champion_ids", deck2.map((e) => e.champion.id!.toString()), { shouldDirty: true });
  };

  if (!current_rsl_account) return null;
  const rslAccountId = current_rsl_account.id;

  const saveDeck = async (
    existing: ITeam | undefined,
    teamName: string,
    championIds: string[],
    clearingStage: string,
    notes: string,
  ) => {
    const payload = {
      team_name: teamName,
      champion_ids: championIds,
      clearing_stage: clearingStage,
      notes,
      user_id: userId,
      rsl_account_id: rslAccountId,
    };

    const supabase_teams = JSON.parse(localStorage.getItem("supabase_team_list") || "[]") as ITeam[];

    if (existing?.id) {
      const res = await updateTeam(existing.id.toString(), payload);
      const updated = supabase_teams.map((t) => (t.id === existing.id ? { ...t, ...res } : t));
      localStorage.setItem("supabase_team_list", JSON.stringify(updated));
    } else {
      const res = await addTeam(payload);
      supabase_teams.push(res);
      localStorage.setItem("supabase_team_list", JSON.stringify(supabase_teams));
    }
  };

  const onSubmit = async (data: GrimForestFormData) => {
    setSaveError(null);
    if (data.deck1_champion_ids.length === 0 || data.deck2_champion_ids.length === 0) {
      setSaveError("Each deck needs at least one champion.");
      return;
    }
    if (!data.clearing_stage.trim()) {
      setSaveError("Clearing stage is required.");
      return;
    }

    try {
      await saveDeck(deck1Team, GRIM_FOREST_DECK_1_SLUG, data.deck1_champion_ids, data.clearing_stage, data.notes);
      await saveDeck(deck2Team, GRIM_FOREST_DECK_2_SLUG, data.deck2_champion_ids, data.clearing_stage, data.notes);
      onClose(true);
    } catch {
      setSaveError("Something went wrong while saving. Please try again.");
    }
  };

  return (
    <Modal isOpen title="Edit Grim Forest Decks" onClose={() => onClose(false)} maxWidthClass="max-w-6xl">
      <form onSubmit={handleSubmit(onSubmit)} className="max-h-[75vh] overflow-auto pt-1 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Clearing Stage
              </label>
              <input
                {...register("clearing_stage")}
                className="input"
                placeholder="E.g. Green, Yellow, Red, Purple"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Notes
              </label>
              <input
                {...register("notes")}
                className="input"
                placeholder="Optional notes about these decks…"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={suggestBothDecks}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer shrink-0"
          >
            <FaMagic size={11} /> Suggest Both Decks
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Deck 1 ({deck1Ids.length}/{GRIM_FOREST_DECK_SIZE})
            </label>
            <Controller
              control={control}
              name="deck1_champion_ids"
              render={({ field }) => (
                <ChampionMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                  champions={deck1Pool}
                  max={GRIM_FOREST_DECK_SIZE}
                  requiredRoles={requiredRoles}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Deck 2 ({deck2Ids.length}/{GRIM_FOREST_DECK_SIZE})
            </label>
            <Controller
              control={control}
              name="deck2_champion_ids"
              render={({ field }) => (
                <ChampionMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                  champions={deck2Pool}
                  max={GRIM_FOREST_DECK_SIZE}
                  requiredRoles={requiredRoles}
                />
              )}
            />
          </div>
        </div>

        {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => onClose(false)} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            {loading ? "Saving…" : "Save Both Decks"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
