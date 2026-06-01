import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type IChampion from "../../models/IChampion";
import DefaultChampionObject from "./defaultChampionObject";
import {
  championSchema,
  type ChampionFormData,
} from "../../lib/zod/championSchema";
import { ChampionAffinity } from "../../models/ChampionAffinity";
import { ChampionType } from "../../models/ChampionType";
import { ChampionRarity } from "../../models/ChampionRarity";
import { ChampionFaction } from "../../models/ChampionFaction";
import { ChampionRoleImageMap } from "../../models/ChampionRole";
import { ROLE_CATEGORIES } from "../../data/roleCategories";
import RaidStarInput from "./inputs/RaidStarInput";
import ToggleInput from "./inputs/ToggleInput";
import { useChampion } from "../../hooks/useChampion";
import { useState } from "react";
import ChampionCard from "../card/ChampionCard";
import getFactionLogo from "../../helpers/getFactionLogo";
import { STOCK_EMPTY_IMAGE } from "../../data/stock_image";
import { FaArrowRight } from "react-icons/fa";
// import SkillsFieldArray from "./inputs/SkillsFieldArray"; // skills hidden
// import AuraField from "./inputs/AuraField"; // skills hidden

interface ChampionFormProps {
  champion?: Partial<IChampion>;
  onClose: (should_reload: boolean) => void;
}

export default function ChampionForm({ champion, onClose }: ChampionFormProps) {
  const [isOnPreview, setIsOnPreview] = useState<boolean>(false);
  const [rosterMatches, setRosterMatches] = useState<IChampion[]>([]);
  const [showRosterDropdown, setShowRosterDropdown] = useState(false);
  const { addChampion, updateChampion, loading } = useChampion();

  const champion_list = JSON.parse(
    localStorage.getItem("supabase_champion_list") ?? "[]",
  ) as IChampion[];

  const { id: userId } = JSON.parse(
    localStorage.getItem("supabase_auth") || "{}",
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return;

  const rslAccountId = current_rsl_account.id;

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
    watch,
    setValue,
    formState: { errors },
    reset,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm<ChampionFormData>({
    resolver: zodResolver(championSchema),
    defaultValues: champion ?? DefaultChampionObject,
  });

  const watchedFormData = watch();

  const previewChampion: IChampion = {
    ...(champion ?? DefaultChampionObject),
    ...watchedFormData,
    aura: watchedFormData.aura ? {
      ...watchedFormData.aura,
      effect: watchedFormData.aura.effect ?? "",
      effectiveness: watchedFormData.aura.effectiveness ?? "",
    } : undefined,
  };

  // ── Roster-based name autocomplete ───────────────────────────────────────

  const handleNameInput = (value: string) => {
    if (value.trim().length >= 2) {
      const lower = value.toLowerCase();
      const hits = champion_list
        .filter((c) => c.name.toLowerCase().includes(lower))
        .slice(0, 6);
      setRosterMatches(hits);
      setShowRosterDropdown(hits.length > 0);
    } else {
      setShowRosterDropdown(false);
    }
  };

  const applyRosterChampion = (existing: IChampion) => {
    const { id: _id, user_id: _uid, rsl_account_id: _rid, priority: _p, ...rest } = existing as IChampion & { priority?: unknown };
    reset({
      ...DefaultChampionObject,
      ...rest,
      user_id: userId,
      rsl_account_id: rslAccountId,
    });
    setShowRosterDropdown(false);
  };

  const onSave = async (data: ChampionFormData) => {
    if (champion?.id) {
      await updateChampion(champion.id.toString(), data)
        .then((res) => {
          const supabase_champions = JSON.parse(
            localStorage.getItem("supabase_champion_list") || "[]",
          );
          const updatedChampions = supabase_champions.map((c: IChampion) =>
            c.id === champion.id ? { ...c, ...res } : c,
          );
          localStorage.setItem(
            "supabase_champion_list",
            JSON.stringify(updatedChampions),
          );
        })
        .catch((error) => {
          console.error("Error updating champion:", error);
        });
    } else {
      await addChampion(data)
        .then((res) => {
          const supabase_champions = JSON.parse(
            localStorage.getItem("supabase_champion_list") || "[]",
          );
          supabase_champions.push(res);
          localStorage.setItem(
            "supabase_champion_list",
            JSON.stringify(supabase_champions),
          );
        })
        .catch((error) => {
          console.error("Error adding champion:", error);
        });
    }

    onClose(true);
  };

  // ── Visual selector helpers ───────────────────────────────────────────────

  const AFFINITY_LABELS: Record<string, string> = {
    [ChampionAffinity.MAGIC]:   "Magic",
    [ChampionAffinity.FORCE]:   "Force",
    [ChampionAffinity.SPIRIT]:  "Spirit",
    [ChampionAffinity.VOID]:    "Void",
  };

  const TYPE_COLORS: Record<string, string> = {
    [ChampionType.ATTACK]:  "bg-red-100 text-red-700 border-red-300",
    [ChampionType.DEFENSE]: "bg-blue-100 text-blue-700 border-blue-300",
    [ChampionType.HP]:      "bg-green-100 text-green-700 border-green-300",
    [ChampionType.SUPPORT]: "bg-amber-100 text-amber-700 border-amber-300",
  };

  const RARITY_COLORS_BTN: Record<string, string> = {
    [ChampionRarity.MYTHICAL]:  "bg-red-100 text-red-700 border-red-300",
    [ChampionRarity.LEGENDARY]: "bg-orange-100 text-orange-700 border-orange-300",
    [ChampionRarity.EPIC]:      "bg-purple-100 text-purple-700 border-purple-300",
    [ChampionRarity.RARE]:      "bg-blue-100 text-blue-700 border-blue-300",
    [ChampionRarity.UNCOMMON]:  "bg-green-100 text-green-700 border-green-300",
    [ChampionRarity.COMMON]:    "bg-gray-100 text-gray-600 border-gray-300",
  };

  const w = watchedFormData;

  return (
    <form onSubmit={handleSubmit(onSave)} className="bg-white">
      {isOnPreview ? (
        <div className="px-4 pb-4">
          <ChampionCard champion={previewChampion} />
        </div>
      ) : (
        <div className="max-h-[76vh] overflow-y-auto">

          {/* ── Name — full width with autocomplete ── */}
          <div className="p-4 border-b border-gray-100 relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
            <input
              {...register("name", { onChange: (e) => handleNameInput(e.target.value) })}
              onBlur={() => setTimeout(() => setShowRosterDropdown(false), 150)}
              placeholder="Type champion name or search existing roster…"
              className="input w-full mt-0.5"
              autoComplete="off"
            />
            {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name?.message}</p>}

            {showRosterDropdown && (
              <ul className="absolute z-40 left-4 right-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                {rosterMatches.map((c) => (
                  <li
                    key={c.id}
                    onMouseDown={() => applyRosterChampion(c)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition"
                  >
                    {c.imgUrl ? (
                      <img src={c.imgUrl} alt={c.name}
                        className="w-7 h-7 rounded-full object-cover object-top bg-gray-100 shrink-0"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm flex-1">{c.name}</span>
                    <span className="text-[10px] text-gray-400">{c.rarity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Image preview + URL fields + Faction ── */}
          <div className="flex gap-3 p-4 bg-gray-50 border-b border-gray-100">
            {/* Image fills the height of the right column */}
            <div className="w-28 self-stretch rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
              <img
                src={previewChampion.imgUrl || STOCK_EMPTY_IMAGE}
                alt={previewChampion.name || "Champion"}
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.src = STOCK_EMPTY_IMAGE; }}
              />
            </div>

            {/* Right column: Image URL, Champion URL, Faction */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Image URL</label>
                <input {...register("imgUrl")} className="input w-full" placeholder="https://…" />
                {errors.imgUrl && <p className="text-red-500 text-xs">{errors.imgUrl?.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Champion URL</label>
                <input {...register("championUrl")} className="input w-full" placeholder="https://…" />
                {errors.championUrl && <p className="text-red-500 text-xs">{errors.championUrl?.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Faction</label>
                <div className="flex items-center gap-2">
                  <img src={getFactionLogo(previewChampion.faction)} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  <select {...register("faction")} className="basic-select flex-1">
                    {Object.values(ChampionFaction).map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                {errors.faction && <p className="text-red-500 text-xs">{errors.faction?.message}</p>}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-5">

            {/* ── Affinity ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Affinity</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(ChampionAffinity).map((path) => {
                  const selected = w.affinity === path;
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => setValue("affinity", path, { shouldDirty: true })}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-[10px] font-semibold transition cursor-pointer
                        ${selected ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}
                    >
                      <img src={path} alt={AFFINITY_LABELS[path]} className="w-6 h-6 object-contain" />
                      {AFFINITY_LABELS[path]}
                    </button>
                  );
                })}
              </div>
              {errors.affinity && <p className="text-red-500 text-xs">{errors.affinity?.message}</p>}
              <input type="hidden" {...register("affinity")} />
            </div>

            {/* ── Type ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(ChampionType).map((type) => {
                  const selected = w.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue("type", type, { shouldDirty: true })}
                      className={`py-2 rounded-xl border-2 text-xs font-semibold transition cursor-pointer
                        ${selected ? `${TYPE_COLORS[type]} border-current` : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              {errors.type && <p className="text-red-500 text-xs">{errors.type?.message}</p>}
              <input type="hidden" {...register("type")} />
            </div>

            {/* ── Rarity ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rarity</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(ChampionRarity).map((rarity) => {
                  const selected = w.rarity === rarity;
                  return (
                    <button
                      key={rarity}
                      type="button"
                      onClick={() => setValue("rarity", rarity, { shouldDirty: true })}
                      className={`py-1.5 rounded-lg border-2 text-xs font-semibold transition cursor-pointer
                        ${selected ? `${RARITY_COLORS_BTN[rarity]} border-current` : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                    >
                      {rarity}
                    </button>
                  );
                })}
              </div>
              {errors.rarity && <p className="text-red-500 text-xs">{errors.rarity?.message}</p>}
              <input type="hidden" {...register("rarity")} />
            </div>

            {/* ── Stats (2-column) ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stats</label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {numericStats.map((stat) => (
                  <div key={stat.name}>
                    <label className="text-xs text-gray-500 mb-0.5 block">{stat.label}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      {...register(stat.name, { valueAsNumber: true })}
                      className="input w-full"
                    />
                    {errors[stat.name] && (
                      <p className="text-red-500 text-[10px]">{errors[stat.name]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Progression ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progression</label>
              <div className="flex gap-4 items-start">
                <div className="w-24">
                  <label className="text-xs text-gray-500 mb-0.5 block">Level</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    {...register("level", { valueAsNumber: true })}
                    className="input w-full"
                  />
                  {errors.level && <p className="text-red-500 text-[10px]">{errors.level?.message}</p>}
                </div>
                <div className="flex-1">
                  <RaidStarInput
                    stars={w.stars ?? 1}
                    ascension={w.ascension_stars ?? 0}
                    awaken={w.awaken_stars ?? 0}
                    onStarsChange={(v) => setValue("stars", v, { shouldDirty: true })}
                    onAscensionChange={(v) => setValue("ascension_stars", v, { shouldDirty: true })}
                    onAwakenChange={(v) => setValue("awaken_stars", v, { shouldDirty: true })}
                  />
                </div>
              </div>
            </div>

            {/* ── Roles ── */}
            {(() => {
              return (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roles</label>
                  {ROLE_CATEGORIES.map(({ label, accent, roles }) => (
                    <div key={label} className="space-y-1.5">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>{label}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {roles.map((role) => {
                          const checked = (w.role ?? []).includes(role);
                          return (
                            <label
                              key={role}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer transition text-xs
                                ${checked
                                  ? "border-amber-400 bg-amber-50 text-amber-700 font-semibold"
                                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                              <input type="checkbox" value={role} {...register("role")} className="hidden" />
                              <img src={ChampionRoleImageMap[role]} alt={role} className="w-4 h-4 object-contain rounded-full shrink-0" />
                              <span className="truncate">{role}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
                </div>
              );
            })()}

            {/* ── Upgrade flags ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <div className="grid grid-cols-2 gap-3">

                {/* Books group */}
                <div className="border border-gray-200 rounded-xl p-3 space-y-3">
                  <ToggleInput
                    label="Needs Books"
                    register={register("is_book_needed", {
                      onChange: (e) => { if (!e.target.checked) setValue("is_booked", false); },
                    })}
                  />
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <div className="flex-1 h-px bg-gray-100" />
                    <FaArrowRight size={10} />
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <ToggleInput
                    label="Is Booked"
                    register={register("is_booked")}
                    disabled={!w.is_book_needed}
                  />
                </div>

                {/* Mastery group */}
                <div className="border border-gray-200 rounded-xl p-3 space-y-3">
                  <ToggleInput
                    label="Needs Mastery"
                    register={register("is_mastery_needed", {
                      onChange: (e) => { if (!e.target.checked) setValue("has_mastery", false); },
                    })}
                  />
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <div className="flex-1 h-px bg-gray-100" />
                    <FaArrowRight size={10} />
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <ToggleInput
                    label="Has Mastery"
                    register={register("has_mastery")}
                    disabled={!w.is_mastery_needed}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Hidden fields */}
          <input type="hidden" {...register("user_id")} value={userId} />
          <input type="hidden" {...register("rsl_account_id")} value={rslAccountId} />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={() => onClose(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setIsOnPreview((prev) => !prev)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 transition cursor-pointer"
        >
          {isOnPreview ? "← Edit" : "Preview"}
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {loading ? "Saving…" : "Save Champion"}
        </button>
      </div>
    </form>
  );
}
