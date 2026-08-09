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
import { ChampionRole, ChampionRoleImageMap } from "../../models/ChampionRole";
import { ROLE_CATEGORIES } from "../../data/roleCategories";
import RaidStarInput from "./inputs/RaidStarInput";
import ToggleInput from "./inputs/ToggleInput";
import { useChampion } from "../../hooks/useChampion";
import { syncRolesForChampionName } from "../../helpers/handleChampions";
import { useState } from "react";
import ChampionCard from "../card/ChampionCard";
import getFactionLogo from "../../helpers/getFactionLogo";
import { STOCK_EMPTY_IMAGE } from "../../data/stock_image";
import { FaArrowRight, FaExclamationTriangle } from "react-icons/fa";
import { getMinStarsForRarity } from "../../helpers/getMinStarsForRarity";
// import SkillsFieldArray from "./inputs/SkillsFieldArray"; // skills hidden
// import AuraField from "./inputs/AuraField"; // skills hidden

interface ChampionFormProps {
  champion?: Partial<IChampion>;
  onClose: (should_reload: boolean) => void;
}

// Roles that count as crowd control — checking any of these auto-selects the CC role.
const CC_TRIGGER_ROLES: ChampionRole[] = [
  ChampionRole.PROVOKER,
  ChampionRole.STUN,
  ChampionRole.FREEZE,
  ChampionRole.SLEEP_DEBUFFER,
  ChampionRole.FEAR,
  ChampionRole.SHEEP,
  ChampionRole.ENSNARE,
  ChampionRole.ENTANGLE,
  ChampionRole.PETRIFICATION,
  ChampionRole.SEAL,
  ChampionRole.DAZED,
];

// Roles that count as continuous healing — checking any of these auto-selects the Healer role.
const HEALER_TRIGGER_ROLES: ChampionRole[] = [ChampionRole.CONTINUOUS_HEAL];

export default function ChampionForm({ champion, onClose }: ChampionFormProps) {
  const [isOnPreview, setIsOnPreview] = useState<boolean>(false);
  const [rosterMatches, setRosterMatches] = useState<IChampion[]>([]);
  const [showRosterDropdown, setShowRosterDropdown] = useState(false);
  const [activeRosterIndex, setActiveRosterIndex] = useState(-1);
  const [saveError, setSaveError] = useState<string | null>(null);
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
    getValues,
    formState: { errors },
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
      const seenNames = new Set<string>();
      const hits: IChampion[] = [];
      for (const c of champion_list) {
        const name = c.name.toLowerCase();
        if (!name.includes(lower) || seenNames.has(name)) continue;
        seenNames.add(name);
        hits.push(c);
        if (hits.length === 6) break;
      }
      setRosterMatches(hits);
      setShowRosterDropdown(hits.length > 0);
      setActiveRosterIndex(-1);
    } else {
      setShowRosterDropdown(false);
      setActiveRosterIndex(-1);
    }
  };

  // Only identity fields carry over from the matched roster champion — stats,
  // level, stars, and book/mastery progress stay whatever the user already
  // has in the form, since a new/edited entry starts its own progress.
  const applyRosterChampion = (existing: IChampion) => {
    setValue("name", existing.name, { shouldDirty: true });
    setValue("imgUrl", existing.imgUrl ?? DefaultChampionObject.imgUrl ?? "", { shouldDirty: true });
    setValue("championUrl", existing.championUrl ?? "", { shouldDirty: true });
    setValue("faction", existing.faction, { shouldDirty: true });
    setValue("affinity", existing.affinity, { shouldDirty: true });
    setValue("type", existing.type, { shouldDirty: true });
    setValue("rarity", existing.rarity, { shouldDirty: true });
    setValue("role", existing.role ?? [], { shouldDirty: true });
    setShowRosterDropdown(false);
    setActiveRosterIndex(-1);
  };

  // Rarity sets a floor on stars (e.g. Rare can't be under 3★) — bump stars
  // up to match if the newly-picked rarity's minimum is higher than whatever
  // is currently set. Never lowers stars the user already raised on purpose.
  const handleRarityChange = (rarity: ChampionRarity) => {
    setValue("rarity", rarity, { shouldDirty: true });
    const newMinStars = getMinStarsForRarity(rarity);
    if ((getValues("stars") ?? 1) < newMinStars) {
      applyStarsChange(newMinStars);
    }
  };

  // Stars set a ceiling on level (10x stars) — clamp level down if it's now
  // above what the new star count allows, same cascade RaidStarInput already
  // does internally for ascension/awaken.
  const applyStarsChange = (v: number) => {
    setValue("stars", v, { shouldDirty: true });
    if ((getValues("ascension_stars") ?? 0) > v) setValue("ascension_stars", v, { shouldDirty: true });
    if ((getValues("awaken_stars") ?? 0) > v) setValue("awaken_stars", v, { shouldDirty: true });
    const newMaxLevel = v * 10;
    if ((getValues("level") ?? 1) > newMaxLevel) setValue("level", newMaxLevel, { shouldDirty: true });
  };
  const handleStarsChange = (v: number) => applyStarsChange(v);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showRosterDropdown || rosterMatches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveRosterIndex((i) => (i + 1) % rosterMatches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveRosterIndex((i) => (i <= 0 ? rosterMatches.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setShowRosterDropdown(false);
      setActiveRosterIndex(-1);
    } else if (e.key === "Enter" && activeRosterIndex >= 0) {
      e.preventDefault();
      applyRosterChampion(rosterMatches[activeRosterIndex]);
    }
  };

  const onSave = async (data: ChampionFormData) => {
    setSaveError(null);

    if (champion?.id) {
      try {
        const res = await updateChampion(champion.id.toString(), data);
        const supabase_champions = JSON.parse(
          localStorage.getItem("supabase_champion_list") || "[]",
        );
        const updatedChampions = supabase_champions.map((c: IChampion) =>
          String(c.id) === String(champion.id) ? { ...c, ...res } : c,
        );
        localStorage.setItem(
          "supabase_champion_list",
          JSON.stringify(updatedChampions),
        );
        syncRolesForChampionName(res.name).catch((error) => {
          console.error("Error syncing roles across accounts:", error);
        });
        window.dispatchEvent(
          new CustomEvent("celebrate-champion", {
            detail: {
              championName: res.name,
              imgUrl: res.imgUrl,
              rarity: res.rarity,
              label: "Champion Updated!",
            },
          }),
        );
      } catch (error) {
        // Bail out here without closing the modal — otherwise a failed save
        // (e.g. a Supabase RLS/network error) looks identical to a
        // successful one, since the roster list would simply reload with
        // whatever's already cached and the edit would appear to vanish.
        console.error("Error updating champion:", error);
        setSaveError("Couldn't save this champion. Please try again.");
        return;
      }
    } else {
      try {
        const res = await addChampion(data);
        const supabase_champions = JSON.parse(
          localStorage.getItem("supabase_champion_list") || "[]",
        );
        supabase_champions.push(res);
        localStorage.setItem(
          "supabase_champion_list",
          JSON.stringify(supabase_champions),
        );
        window.dispatchEvent(
          new CustomEvent("celebrate-champion", {
            detail: {
              championName: res.name,
              imgUrl: res.imgUrl,
              rarity: res.rarity,
              label: "New Champion!",
            },
          }),
        );
      } catch (error) {
        console.error("Error adding champion:", error);
        setSaveError("Couldn't add this champion. Please try again.");
        return;
      }
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
    [ChampionType.ATTACK]:  "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    [ChampionType.DEFENSE]: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    [ChampionType.HP]:      "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    [ChampionType.SUPPORT]: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    [ChampionType.OTHER]:   "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  };

  const RARITY_COLORS_BTN: Record<string, string> = {
    [ChampionRarity.MYTHICAL]:  "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    [ChampionRarity.LEGENDARY]: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    [ChampionRarity.EPIC]:      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    [ChampionRarity.RARE]:      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    [ChampionRarity.UNCOMMON]:  "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    [ChampionRarity.COMMON]:    "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  };

  const w = watchedFormData;
  const minStars = getMinStarsForRarity(w.rarity);
  const maxLevel = (w.stars ?? minStars) * 10;

  // Flags the champion's level as it was when the modal was opened (not the
  // live, still-being-edited value) — a heads-up for legacy roster data that
  // predates this level-can't-exceed-10x-stars rule, surfaced immediately
  // rather than only after the user happens to touch level/stars themselves.
  const existingLevelWarning =
    champion?.level != null && champion.stars != null && champion.level > champion.stars * 10
      ? `This champion was saved at level ${champion.level}, above the max of ${champion.stars * 10} for ${champion.stars}★. Lower the level or raise the stars to fix it.`
      : null;

  // Exact-name match within the current roster account — a nudge to use the
  // autocomplete dropdown above instead of accidentally creating a duplicate.
  const duplicateChampion = (() => {
    const name = w.name?.trim().toLowerCase();
    if (!name) return null;
    return (
      champion_list.find(
        (c) =>
          c.name.trim().toLowerCase() === name &&
          c.rsl_account_id === rslAccountId &&
          c.id !== champion?.id,
      ) ?? null
    );
  })();

  return (
    <form onSubmit={handleSubmit(onSave)} className="bg-white dark:bg-gray-900 dark:text-gray-100">
      {existingLevelWarning && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400">
          <FaExclamationTriangle size={14} className="mt-0.5 shrink-0" />
          <p className="text-xs">{existingLevelWarning}</p>
        </div>
      )}
      {isOnPreview ? (
        <div className="px-4 pb-4 max-h-[76vh] overflow-y-auto">
          <div className="max-w-xs mx-auto">
            <ChampionCard champion={previewChampion} />
          </div>
        </div>
      ) : (
        <div className="max-h-[76vh] overflow-y-auto">

          {/* ── Name — full width with autocomplete ── */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
            <input
              {...register("name", { onChange: (e) => handleNameInput(e.target.value) })}
              onKeyDown={handleNameKeyDown}
              onBlur={() => setTimeout(() => setShowRosterDropdown(false), 150)}
              placeholder="Type champion name or search existing roster…"
              className="input w-full mt-0.5"
              autoComplete="off"
            />
            {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name?.message}</p>}
            {!errors.name && duplicateChampion && !showRosterDropdown && (
              <p className="text-amber-600 text-xs mt-0.5 font-medium">
                It is a duplicate champion.
              </p>
            )}

            {showRosterDropdown && (
              <ul className="absolute z-40 left-4 right-4 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                {rosterMatches.map((c, i) => (
                  <li
                    key={c.id}
                    onMouseDown={() => applyRosterChampion(c)}
                    onMouseEnter={() => setActiveRosterIndex(i)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition text-gray-900 dark:text-gray-100 ${
                      i === activeRosterIndex ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" : "hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400"
                    }`}
                  >
                    {c.imgUrl ? (
                      <img src={c.imgUrl} alt={c.name}
                        className="w-7 h-7 rounded-full object-cover object-top bg-gray-100 shrink-0"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
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

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">

            {/* ══ LEFT COLUMN: identity ══ */}
            <div className="lg:col-span-5 lg:border-r lg:border-gray-100 dark:lg:border-gray-800">

              {/* ── Image preview + URL fields + Faction ── */}
              <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 lg:border-b-0 lg:mx-4 lg:mt-4 lg:rounded-xl lg:border dark:lg:border-gray-800">
                {/* Image fills the height of the right column */}
                <div className="w-28 self-stretch rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 shrink-0">
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
                            ${selected ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
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
                            ${selected ? `${TYPE_COLORS[type]} border-current` : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
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
                          onClick={() => handleRarityChange(rarity)}
                          className={`py-1.5 rounded-lg border-2 text-xs font-semibold transition cursor-pointer
                            ${selected ? `${RARITY_COLORS_BTN[rarity]} border-current` : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                        >
                          {rarity}
                        </button>
                      );
                    })}
                  </div>
                  {errors.rarity && <p className="text-red-500 text-xs">{errors.rarity?.message}</p>}
                  <input type="hidden" {...register("rarity")} />
                </div>

              </div>
            </div>

            {/* ══ RIGHT COLUMN: progression, stats & status ══ */}
            <div className="lg:col-span-7">
              <div className="p-4 space-y-5">

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
                        min={1}
                        max={maxLevel}
                        className="input w-full"
                      />
                      {errors.level && <p className="text-red-500 text-[10px]">{errors.level?.message}</p>}
                    </div>
                    <div className="flex-1">
                      <RaidStarInput
                        stars={w.stars ?? minStars}
                        ascension={w.ascension_stars ?? 0}
                        awaken={w.awaken_stars ?? 0}
                        minStars={minStars}
                        onStarsChange={handleStarsChange}
                        onAscensionChange={(v) => setValue("ascension_stars", v, { shouldDirty: true })}
                        onAwakenChange={(v) => setValue("awaken_stars", v, { shouldDirty: true })}
                      />
                      {errors.stars && <p className="text-red-500 text-xs mt-1">{errors.stars?.message}</p>}
                    </div>
                  </div>
                </div>

                {/* ── Stats ── */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stats</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
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

                {/* ── Upgrade flags ── */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="grid grid-cols-2 gap-3">

                    {/* Books group */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3">
                      <ToggleInput
                        label="Needs Books"
                        register={register("is_book_needed", {
                          onChange: (e) => { if (!e.target.checked) setValue("is_booked", false); },
                        })}
                      />
                      <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600">
                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                        <FaArrowRight size={10} />
                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                      </div>
                      <ToggleInput
                        label="Is Booked"
                        register={register("is_booked")}
                        disabled={!w.is_book_needed}
                      />
                    </div>

                    {/* Mastery group */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3">
                      <ToggleInput
                        label="Needs Mastery"
                        register={register("is_mastery_needed", {
                          onChange: (e) => { if (!e.target.checked) setValue("has_mastery", false); },
                        })}
                      />
                      <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600">
                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                        <FaArrowRight size={10} />
                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
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
            </div>

          </div>

          {/* ── Roles — full width, since it has by far the most content ── */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            {(() => {
              // Pair the two biggest categories together and the two
              // smallest together, so neither row in the 2-column layout
              // has one tall category next to a short one leaving a gap.
              const sortedCategories = [...ROLE_CATEGORIES].sort(
                (a, b) => b.roles.length - a.roles.length,
              );
              const notViableChecked = (w.role ?? []).includes(ChampionRole.NOT_VIABLE);
              return (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roles</label>

                  {/* Not Viable — standalone flag, shown first, not part of any category */}
                  <label
                    className={`flex items-center gap-1.5 w-fit px-2 py-1.5 rounded-lg border cursor-pointer transition text-xs
                      ${notViableChecked
                        ? "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    <input
                      type="checkbox"
                      value={ChampionRole.NOT_VIABLE}
                      {...register("role")}
                      className="hidden"
                    />
                    <img
                      src={ChampionRoleImageMap[ChampionRole.NOT_VIABLE]}
                      alt={ChampionRole.NOT_VIABLE}
                      className="w-4 h-4 object-contain rounded-full shrink-0"
                    />
                    <span className="truncate">{ChampionRole.NOT_VIABLE}</span>
                  </label>

                  <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
                    {sortedCategories.map(({ label, accent, roles }) => (
                      <div key={label} className="space-y-1.5 mb-4 lg:mb-5">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>{label}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                          {roles.map((role) => {
                            const checked = (w.role ?? []).includes(role);
                            return (
                              <label
                                key={role}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer transition text-xs
                                  ${checked
                                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold"
                                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  value={role}
                                  {...register("role")}
                                  onChange={(e) => {
                                    register("role").onChange(e);
                                    if (!e.target.checked) return;

                                    const current = getValues("role") ?? [];
                                    let next = current;
                                    if (label === "Buff" && !next.includes(ChampionRole.BUFFER)) {
                                      next = [...next, ChampionRole.BUFFER];
                                    }
                                    if (label === "Debuff" && !next.includes(ChampionRole.DEBUFFER)) {
                                      next = [...next, ChampionRole.DEBUFFER];
                                    }
                                    if (
                                      CC_TRIGGER_ROLES.includes(role) &&
                                      !next.includes(ChampionRole.CONTROL)
                                    ) {
                                      next = [...next, ChampionRole.CONTROL];
                                    }
                                    if (
                                      HEALER_TRIGGER_ROLES.includes(role) &&
                                      !next.includes(ChampionRole.HEALER)
                                    ) {
                                      next = [...next, ChampionRole.HEALER];
                                    }
                                    if (next !== current) setValue("role", next, { shouldDirty: true });
                                  }}
                                  className="hidden"
                                />
                                <img src={ChampionRoleImageMap[role]} alt={role} className="w-4 h-4 object-contain rounded-full shrink-0" />
                                <span className="truncate">{role}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
                </div>
              );
            })()}
          </div>

          {/* Hidden fields */}
          <input type="hidden" {...register("user_id")} value={userId} />
          <input type="hidden" {...register("rsl_account_id")} value={rslAccountId} />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
        {saveError && (
          <p className="text-red-500 text-xs mr-auto">{saveError}</p>
        )}
        <button
          type="button"
          onClick={() => onClose(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setIsOnPreview((prev) => !prev)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
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
