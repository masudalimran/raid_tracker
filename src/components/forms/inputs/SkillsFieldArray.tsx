import {
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import type { ChampionFormData } from "../../../lib/zod/championSchema";
import SkillEffectsFieldArray from "./SkillEffectFieldArray";

interface Props {
  control: Control<ChampionFormData>;
  register: UseFormRegister<ChampionFormData>;
}

export default function SkillsFieldArray({ control, register }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  return (
    <div>
      <hr className="my-2" />
      <p className="text-xl font-bold">Skills</p>
      <hr className="my-2" />

      {fields.map((skill, skillIndex) => (
        <div key={skill.id} className="border p-4 mb-4 rounded bg-gray-50">
          <div>
            <label className="font-semibold">Skill Index</label>
            <input
              type="number"
              {...register(`skills.${skillIndex}.skill_index`, {
                valueAsNumber: true,
              })}
              className="input"
            />
          </div>

          {/* 🔥 Effects handled by child component */}
          <SkillEffectsFieldArray
            control={control}
            register={register}
            skillIndex={skillIndex}
          />

          <button
            type="button"
            onClick={() => remove(skillIndex)}
            className="block mt-3 text-red-600 rounded border border-red-600 px-3 py-1 cursor-pointer"
          >
            Remove Skill
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            skill_index: fields.length + 1,
            effects: [],
          })
        }
        className="bg-black text-white px-3 py-1 rounded cursor-pointer"
      >
        + Add Skill
      </button>
    </div>
  );
}
