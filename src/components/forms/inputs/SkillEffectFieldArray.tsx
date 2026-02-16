import {
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { useState } from "react";
import type { ChampionFormData } from "../../../lib/zod/championSchema";
import { buffs } from "../../../data/buffs";
import { debuffs } from "../../../data/debuffs";

interface Props {
  control: Control<ChampionFormData>;
  register: UseFormRegister<ChampionFormData>;
  skillIndex: number;
}

export default function SkillEffectsFieldArray({
  control,
  register,
  skillIndex,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `skills.${skillIndex}.effects`,
  });

  const [effectOptions] = useState<{ buff: string[]; debuff: string[] }>({
    buff: buffs,
    debuff: debuffs,
  });

  return (
    <div>
      <p className="font-semibold mt-3">Effects</p>

      {fields.map((effect, effectIndex) => {
        type EffectType = "buff" | "debuff";

        const currentType: EffectType =
          (control._formValues.skills?.[skillIndex]?.effects?.[effectIndex]
            ?.type as EffectType) || "buff";

        const options = effectOptions[currentType];

        return (
          <div
            key={effect.id}
            className="border p-3 mt-2 rounded bg-white space-y-2"
          >
            {/* Type */}
            <div>
              <label
                htmlFor={`skills.${skillIndex}.effects.${effectIndex}.type`}
                className="block text-sm font-medium text-gray-700"
              >
                Type
              </label>
              <select
                id={`skills.${skillIndex}.effects.${effectIndex}.type`}
                {...register(
                  `skills.${skillIndex}.effects.${effectIndex}.type`,
                )}
                className="input"
              >
                <option value="buff">Buff</option>
                <option value="debuff">Debuff</option>
              </select>
            </div>

            {/* Effect Name */}
            <div>
              <label
                htmlFor={`skills.${skillIndex}.effects.${effectIndex}.name`}
                className="block text-sm font-medium text-gray-700"
              >
                Effect Name
              </label>
              <select
                id={`skills.${skillIndex}.effects.${effectIndex}.name`}
                {...register(
                  `skills.${skillIndex}.effects.${effectIndex}.name`,
                )}
                className="input"
              >
                {options.map((name) => (
                  <option
                    key={name}
                    value={name}
                    className="flex justify-between w-full "
                  >
                    <p>{name}</p>
                    <img
                      src={`/img/${currentType}s/${name}.png`}
                      alt="effect preview"
                      className="w-6 h-6 mt-1"
                    />
                  </option>
                ))}
              </select>
            </div>

            {/* Cooldown */}
            <div>
              <label
                htmlFor={`skills.${skillIndex}.effects.${effectIndex}.cool_down`}
                className="block text-sm font-medium text-gray-700"
              >
                Cooldown
              </label>
              <input
                id={`skills.${skillIndex}.effects.${effectIndex}.cool_down`}
                type="number"
                {...register(
                  `skills.${skillIndex}.effects.${effectIndex}.cool_down`,
                  { valueAsNumber: true },
                )}
                className="input"
              />
            </div>

            {/* Land Chance */}
            <div>
              <label
                htmlFor={`skills.${skillIndex}.effects.${effectIndex}.land_chance`}
                className="block text-sm font-medium text-gray-700"
              >
                Land Chance (%)
              </label>
              <input
                id={`skills.${skillIndex}.effects.${effectIndex}.land_chance`}
                type="number"
                {...register(
                  `skills.${skillIndex}.effects.${effectIndex}.land_chance`,
                  { valueAsNumber: true },
                )}
                className="input"
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor={`skills.${skillIndex}.effects.${effectIndex}.duration`}
                className="block text-sm font-medium text-gray-700"
              >
                Duration
              </label>
              <input
                id={`skills.${skillIndex}.effects.${effectIndex}.duration`}
                type="number"
                {...register(
                  `skills.${skillIndex}.effects.${effectIndex}.duration`,
                  { valueAsNumber: true },
                )}
                className="input"
              />
            </div>

            {/* Target */}
            <div>
              <label
                htmlFor={`skills.${skillIndex}.effects.${effectIndex}.target`}
                className="block text-sm font-medium text-gray-700"
              >
                Target
              </label>
              <select
                id={`skills.${skillIndex}.effects.${effectIndex}.target`}
                {...register(
                  `skills.${skillIndex}.effects.${effectIndex}.target`,
                )}
                className="input"
              >
                <option value="Single">Single</option>
                <option value="All">All</option>
                <option value="Random_Multiple">Random Multiple</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => remove(effectIndex)}
              className="text-red-600 text-sm mt-1 border border-red-600 rounded px-3 py-1 cursor-pointer"
            >
              Remove Effect
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() =>
          append({
            name: "",
            type: "buff",
            cool_down: 0,
            land_chance: 100,
            duration: 0,
            target: "Single",
          })
        }
        className="mt-2 bg-black text-white px-3 py-1 rounded cursor-pointer"
      >
        + Add Effect
      </button>
    </div>
  );
}
