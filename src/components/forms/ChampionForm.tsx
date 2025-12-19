import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type IChampion from "../../models/IChampion";
import DefaultChampionObject from "./defaultChampionObject";
import {
  championSchema,
  type ChampionFormData,
} from "../../lib/zod/championSchema";
import SelectField from "./inputs/SelectField";
import { ChampionAffinity } from "../../models/ChampionAffinity";
import { ChampionType } from "../../models/ChampionType";
import { ChampionRarity } from "../../models/ChampionRarity";
import { ChampionFaction } from "../../models/ChampionFaction";
import { ChampionRole } from "../../models/ChampionRole";
import StarRatingInput from "./inputs/StartRatingInput";
import ToggleInput from "./inputs/ToggleInput";
import { useChampion } from "../../hooks/useChampion";

interface ChampionFormProps {
  champion?: Partial<IChampion>;
  onClose: (should_reload: boolean) => void;
}

export default function ChampionForm({ champion, onClose }: ChampionFormProps) {
  const { addChampion, updateChampion, loading } = useChampion();

  const { id: userId } = JSON.parse(
    localStorage.getItem("supabase_auth") || "{}"
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]"
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return;

  const rslAccountId = current_rsl_account.id;

  const textFields: { label: string; name: keyof ChampionFormData }[] = [
    { label: "Name", name: "name" },
    { label: "Image URL", name: "imgUrl" },
    { label: "Champion Page URL", name: "championUrl" },
  ];

  const numericStats: { label: string; name: keyof ChampionFormData }[] = [
    { label: "HP", name: "hp" },
    { label: "ATK", name: "atk" },
    { label: "DEF", name: "def" },
    { label: "SPD", name: "spd" },
    { label: "C. Rate", name: "c_rate" },
    { label: "C. DMG", name: "c_dmg" },
    { label: "RES", name: "res" },
    { label: "ACC", name: "acc" },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm<ChampionFormData>({
    resolver: zodResolver(championSchema),
    defaultValues: champion ?? DefaultChampionObject,
  });

  const onSave = async (data: ChampionFormData) => {
    if (champion?.id) {
      await updateChampion(champion.id.toString(), data)
        .then((res) => {
          const supabase_champions = JSON.parse(
            localStorage.getItem("supabase_champion_list") || "[]"
          );
          const updatedChampions = supabase_champions.map((c: IChampion) =>
            c.id === champion.id ? { ...c, ...res } : c
          );
          localStorage.setItem(
            "supabase_champion_list",
            JSON.stringify(updatedChampions)
          );
        })
        .catch((error) => {
          console.error("Error updating champion:", error);
        });
    } else {
      await addChampion(data)
        .then((res) => {
          const supabase_champions = JSON.parse(
            localStorage.getItem("supabase_champion_list") || "[]"
          );
          supabase_champions.push(res);
          localStorage.setItem(
            "supabase_champion_list",
            JSON.stringify(supabase_champions)
          );
        })
        .catch((error) => {
          console.error("Error adding champion:", error);
        });
    }

    onClose(true);
  };

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="bg-white max-h-[80vh] overflow-auto px-8 border-t-2 pt-2"
    >
      <hr className="my-2" />
      <p className="text-xl font-bold">Basic Info</p>
      <hr className="my-2" />

      {textFields.map((field) => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input {...register(field.name)} className="input" />
          {errors[field.name] && (
            <p className="text-red-500">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}

      <hr className="my-2" />
      <p className="text-xl font-bold">Stat Info</p>
      <hr className="my-2" />

      {numericStats.map((stat) => (
        <div key={stat.name}>
          <label>{stat.label}</label>
          <input
            type="number"
            inputMode="numeric"
            {...register(stat.name, { valueAsNumber: true })}
            className="mb-2 w-full border px-2 py-1 rounded"
          />
          {errors[stat.name] && (
            <p className="text-red-500">{errors[stat.name]?.message}</p>
          )}
        </div>
      ))}

      <hr className="my-2" />
      <p className="text-xl font-bold">Champion Specific</p>
      <hr className="my-2" />

      <div>
        <label>Level</label>
        <input
          type="number"
          inputMode="numeric"
          {...register("level", { valueAsNumber: true })}
          className="mb-2 w-full border px-2 py-1 rounded"
        />
        {errors.level && (
          <p className="text-red-500">{errors.level?.message}</p>
        )}
      </div>

      <SelectField
        label="Affinity"
        options={Object.values(ChampionAffinity)}
        register={register("affinity")}
        error={errors.affinity}
      />

      <SelectField
        label="Type"
        options={Object.values(ChampionType)}
        register={register("type")}
        error={errors.type}
      />

      <SelectField
        label="Rarity"
        options={Object.values(ChampionRarity)}
        register={register("rarity")}
        error={errors.rarity}
      />

      <SelectField
        label="Faction"
        options={Object.values(ChampionFaction)}
        register={register("faction")}
        error={errors.faction}
      />

      <label className="font-semibold">Role</label>

      <div className="grid grid-cols-2 gap-2">
        {Object.values(ChampionRole).map((role) => (
          <label key={role} className="flex items-center gap-2">
            <input type="checkbox" value={role} {...register("role")} />
            {role}
          </label>
        ))}
      </div>

      {errors.role && <p className="text-red-500">{errors.role.message}</p>}

      <hr className="my-2" />
      <p className="text-xl font-bold">Upgrade Specific</p>
      <hr className="my-2" />

      <StarRatingInput name="stars" label="Stars" control={control} />

      <StarRatingInput
        name="ascension_stars"
        label="Ascension Stars"
        control={control}
        allowZero
      />

      <StarRatingInput
        name="awaken_stars"
        label="Awaken Stars"
        control={control}
        allowZero
      />

      <ToggleInput label="Is Booked" register={register("is_booked")} />
      <ToggleInput label="Needs Books" register={register("is_book_needed")} />
      <ToggleInput label="Has Mastery" register={register("has_mastery")} />
      <ToggleInput
        label="Needs Mastery"
        register={register("is_mastery_needed")}
      />

      {/* Hidden fields */}
      <input type="hidden" {...register("user_id")} value={userId} />
      <input
        type="hidden"
        {...register("rsl_account_id")}
        value={rslAccountId}
      />

      <hr className="my-4" />

      <div className="flex justify-end gap-2 mt-2 [&>button]:cursor-pointer">
        <button
          type="button"
          onClick={() => onClose(false)}
          className="border border-gray-500 hover:bg-gray-600 transition text-gray-500 hover:text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
