import {
  useController,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import type { ChampionFormData } from "../../../lib/zod/championSchema";
import type { FC } from "react";
import { auras } from "../../../data/auras";

interface AuraFieldProps {
  control: Control<ChampionFormData>;
  register: UseFormRegister<ChampionFormData>;
  errors: FieldErrors<ChampionFormData>;
}

const AuraField: FC<AuraFieldProps> = ({ control, register, errors }) => {
  // RHF controller ensures default value exists
  const { field } = useController({
    name: "aura",
    control,
    defaultValue: { effect: "", active_in: "All", effectiveness: "N/A" },
  });

  return (
    <div className="mt-4">
      <p className="text-xl font-bold">Aura</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Effect Name Dropdown */}
        <div>
          <label>Effect Name</label>
          <select
            {...register("aura.effect")}
            className="input"
            defaultValue={field?.value?.effect || ""}
          >
            <option value="">Select Aura</option>
            {auras.map((auraName) => (
              <option key={auraName} value={auraName}>
                {auraName}
              </option>
            ))}
          </select>
          {errors.aura?.effect && (
            <p className="text-red-500 uppercase">
              {errors.aura.effect?.message}
            </p>
          )}
        </div>

        {/* Active In */}
        <div>
          <label>Active In</label>
          <select
            {...register("aura.active_in")}
            className="input"
            defaultValue={field?.value?.active_in || "All"}
          >
            <option value="All">All</option>
            <option value="Arena">Arena</option>
            <option value="Dungeons">Dungeons</option>
            <option value="Faction Wars">Faction Wars</option>
            <option value="Doom Tower">Doom Tower</option>
          </select>
          {errors.aura?.active_in && (
            <p className="text-red-500">{errors.aura.active_in?.message}</p>
          )}
        </div>

        {/* Effectiveness */}
        <div>
          <label>Effectiveness</label>
          <input
            {...register("aura.effectiveness")}
            className="input"
            placeholder="0-100"
            defaultValue={field?.value?.effectiveness || "N/A"}
          />
          {errors.aura?.effectiveness && (
            <p className="text-red-500">{errors.aura.effectiveness?.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuraField;
