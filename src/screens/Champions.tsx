import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaPlusSquare, FaFileImport } from "react-icons/fa";
import { TbTool } from "react-icons/tb";
import { CiSearch } from "react-icons/ci";
import { MdChecklist, MdClose, MdDeleteSweep, MdDownload, MdImportExport } from "react-icons/md";
import { supabase } from "../lib/supabaseClient";

import ChampionCard from "../components/card/ChampionCard";
import ChampionModal from "../components/modals/ChampionModal";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import Modal from "../components/modals/Modal";
import Tooltip from "../components/utility/Tooltip";

import type IChampion from "../models/IChampion";
import { fetchChampions, generateChampions, findOtherChampionDuplicates, removeChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import { MdFilterAlt, MdFilterAltOff } from "react-icons/md";
import SelectChampionFilter from "../components/forms/inputs/SelectChampionFilter";
import type { ChampionFilter, FilterStat } from "../models/ChampionFilter";
import {
  sortByBookPriorityDesc,
  sortByMasteryPriorityDesc,
  sortByRarity,
  sortChampions,
} from "../helpers/sortChampions";
import { ChampionRarity } from "../models/ChampionRarity";
import type ITeam from "../models/ITeam";
import EmptyChampionList from "../components/empty/EmptyChampionList";
import type { ChampionRole } from "../models/ChampionRole";
import { getNsfwStatus } from "../helpers/getNsfwStatus";
import { getCurrentlyInUseChampions } from "../helpers/getChampionsInUse";
// import { getShowSkillsStatus } from "../helpers/getShowSkillsStatus"; // skills hidden
import { checkIfChampionIsBuilt } from "../helpers/checkIfChampionIsBuilt";
import { getBuildQuality, getChampionBuildBreakdown } from "../helpers/getChampionBuildQuality";

const STATUS_OPTIONS = [
  { key: "in_use", label: "In Use" },
  { key: "built", label: "Built" },
  { key: "needs_work", label: "Needs Work" },
  { key: "needs_level", label: "Need Level" },
  { key: "not_built", label: "Not Built" },
  { key: "untouched", label: "Untouched" },
] as const;
type BuildStatusKey = (typeof STATUS_OPTIONS)[number]["key"];
const isBuildStatusKey = (value: string | null): value is BuildStatusKey =>
  !!value && STATUS_OPTIONS.some((s) => s.key === value);

function matchesBuildStatus(champion: IChampion, status: BuildStatusKey, inUseIds: Set<string>): boolean {
  switch (status) {
    case "in_use": return inUseIds.has(String(champion.id));
    case "built": return getBuildQuality(champion, checkIfChampionIsBuilt(champion)) === "built";
    case "needs_work": return getBuildQuality(champion, checkIfChampionIsBuilt(champion)) === "needs_improvement";
    case "needs_level": return getBuildQuality(champion, checkIfChampionIsBuilt(champion)) === "needs_level";
    case "not_built": return getBuildQuality(champion, checkIfChampionIsBuilt(champion)) === "not_built";
    case "untouched": return getBuildQuality(champion, checkIfChampionIsBuilt(champion)) === "untouched";
  }
}

const initial_filter_info: ChampionFilter = {
  stat: "name",
  type: "type_all",
  role: "role_all",
  faction: "faction_all",
  rarity: "rarity_all",
  sortOrder: "desc",
  buff: "",
  debuff: "",
  aura: "",
};

export default function Champions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [loading, setLoading] = useState(true);
  const [nsfw, setNsfw] = useState<boolean>(false);
  // const [showSkills, setShowSkills] = useState<boolean>(false); // skills hidden
  const [teams, setTeams] = useState<ITeam[]>([]);

  // Every filter (and the search box) lives in the URL — not local state —
  // so a specific filtered view is bookmarkable/shareable and back/forward
  // navigation works as expected.
  const onFilterMode = searchParams.get("filterOpen") === "1";

  // Build-status pill (Total/In Use/Built/Needs Work/Need Level/Untouched) —
  // a single-select filter layered on top of whatever search/filter-panel
  // narrowing is already active. "Total" (or clicking the active pill again)
  // clears it.
  const statusParam = searchParams.get("status");
  const buildStatus: BuildStatusKey | null = isBuildStatusKey(statusParam) ? statusParam : null;
  const setBuildStatus = (status: BuildStatusKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get("status") === status) next.delete("status");
      else next.set("status", status);
      return next;
    }, { replace: true });
  };
  const clearBuildStatus = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("status");
      return next;
    }, { replace: true });
  };

  const searchText = searchParams.get("q") ?? "";
  const setSearchText = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("q", value);
      else next.delete("q");
      return next;
    }, { replace: true });
  };

  const filterInfo = useMemo<ChampionFilter>(() => ({
    stat: (searchParams.get("stat") as FilterStat) ?? initial_filter_info.stat,
    type: searchParams.get("type") ?? initial_filter_info.type,
    role: searchParams.get("role") ?? initial_filter_info.role,
    faction: searchParams.get("faction") ?? initial_filter_info.faction,
    rarity: searchParams.get("rarity") ?? initial_filter_info.rarity,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? initial_filter_info.sortOrder,
    buff: searchParams.get("buff") ?? initial_filter_info.buff,
    debuff: searchParams.get("debuff") ?? initial_filter_info.debuff,
    aura: searchParams.get("aura") ?? initial_filter_info.aura,
  }), [searchParams]);

  const setFilterInfo: Dispatch<SetStateAction<ChampionFilter>> = (update) => {
    const nextFilter = typeof update === "function" ? update(filterInfo) : update;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      (Object.keys(initial_filter_info) as (keyof ChampionFilter)[]).forEach((key) => {
        const value = nextFilter[key];
        if (value === initial_filter_info[key]) next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    }, { replace: true });
  };
  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);

  // Import/Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bulk edit
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Duplicate "Other" champion cleanup
  const [showDedupeConfirm, setShowDedupeConfirm] = useState(false);
  const [dedupeStatus, setDedupeStatus] = useState<"idle" | "removing" | "error">("idle");

  const toggleSelect = (id: string | number) => {
    const sid = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = (filteredChampions ?? []).map((c) => String(c.id));
    const allSelected = allIds.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  const exitBulkMode = () => { setBulkMode(false); setSelected(new Set()); };

  const batchUpdate = async (fields: Record<string, boolean>) => {
    if (selected.size === 0 || bulkUpdating) return;
    setBulkUpdating(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("champions").update(fields).in("id", ids);
    if (!error) {
      localStorage.removeItem("supabase_champion_list");
      await loadChampions();
      setSelected(new Set());
    }
    setBulkUpdating(false);
  };

  const loadChampions = useCallback(async () => {
    setLoading(true);
    try {
      await fetchChampions();
      const generated = await generateChampions();
      setChampionList(generated || []);
      await fetchTeams();
    } catch (error) {
      console.error("Error loading champions:", error);
      setChampionList([]);
    }

    setTimeout(() => setLoading(false), 400);
  }, []);

  useEffect(() => {
    loadChampions();
  }, [loadChampions]);

  useEffect(() => {
    fetchTeams().then(setTeams);
    setNsfw(getNsfwStatus());
    // setShowSkills(getShowSkillsStatus()); // skills hidden
  }, []);

  // Search/filter-panel narrowing only — the build-status pill is layered on
  // top of this separately, so pill counts stay stable no matter which pill
  // (if any) is currently selected.
  const baseFilteredChampions = useMemo(() => {
    if (!onFilterMode) {
      if (!searchText) return championList;
      const lower = searchText.toLowerCase();
      return championList.filter((c) => c.name.toLowerCase().includes(lower));
    }

    let list = [...championList];

    if (filterInfo.faction !== "faction_all")
      list = list.filter((c) => c.faction === filterInfo.faction);
    if (filterInfo.type !== "type_all")
      list = list.filter((c) => c.type === filterInfo.type);
    if (filterInfo.role !== "role_all")
      list = list.filter((c) =>
        c.role.includes(filterInfo.role as ChampionRole),
      );
    if (filterInfo.rarity !== "rarity_all")
      list = list.filter((c) => c.rarity === filterInfo.rarity);
    if (filterInfo.buff)
      list = list.filter((c) =>
        c.skills?.some((s) =>
          s.effects?.some(
            (e) => e.type === "buff" && e.name === filterInfo.buff,
          ),
        ),
      );
    if (filterInfo.debuff)
      list = list.filter((c) =>
        c.skills?.some((s) =>
          s.effects?.some(
            (e) => e.type === "debuff" && e.name === filterInfo.debuff,
          ),
        ),
      );
    if (filterInfo.aura)
      list = list.filter(
        (c) => c.aura?.effect.toLowerCase() === filterInfo.aura?.toLowerCase(),
      );

    if (filterInfo.stat === "book_priority") {
      list = [
        ...sortByBookPriorityDesc([...list], teams, ChampionRarity.MYTHICAL),
        ...sortByBookPriorityDesc([...list], teams, ChampionRarity.LEGENDARY),
        ...sortByBookPriorityDesc([...list], teams, ChampionRarity.EPIC),
        ...sortByBookPriorityDesc([...list], teams, ChampionRarity.RARE),
        ...sortByBookPriorityDesc([...list], teams, ChampionRarity.UNCOMMON),
      ];
      return filterInfo.sortOrder === "desc" ? list : [...list].reverse();
    }
    if (filterInfo.stat === "mastery_priority") {
      list = sortByMasteryPriorityDesc([...list], teams);
      return filterInfo.sortOrder === "desc" ? list : [...list].reverse();
    }
    if (filterInfo.stat === "rarity") {
      return sortByRarity([...list], filterInfo.sortOrder);
    }
    if (filterInfo.stat) {
      return sortChampions([...list], filterInfo.stat, filterInfo.sortOrder);
    }
  }, [
    onFilterMode,
    searchText,
    championList,
    filterInfo.faction,
    filterInfo.type,
    filterInfo.role,
    filterInfo.rarity,
    filterInfo.buff,
    filterInfo.debuff,
    filterInfo.aura,
    filterInfo.stat,
    filterInfo.sortOrder,
    teams,
  ]);

  // Final displayed list — base narrowing plus the build-status pill, if any.
  const filteredChampions = useMemo(() => {
    const base = baseFilteredChampions ?? [];
    if (!buildStatus) return base;
    const inUseIds = new Set(getCurrentlyInUseChampions(base).map((c) => String(c.id)));
    return base.filter((c) => matchesBuildStatus(c, buildStatus, inUseIds));
  }, [baseFilteredChampions, buildStatus]);

  const handleDownloadJson = () => {
    const slugToReadable = (slug: string) =>
      slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const exportChampions = championList.map((c) => {
      const usedIn = teams
        .filter((t) => t.champion_ids.includes(String(c.id)))
        .map((t) => slugToReadable(t.team_name));

      return {
        name: c.name,
        rarity: c.rarity,
        faction: c.faction,
        type: c.type,
        affinity: c.affinity,
        role: c.role,
        level: c.level,
        stars: c.stars,
        ascension_stars: c.ascension_stars,
        awaken_stars: c.awaken_stars,
        stats: {
          hp: c.hp,
          atk: c.atk,
          def: c.def,
          spd: c.spd,
          c_rate: c.c_rate,
          c_dmg: c.c_dmg,
          res: c.res,
          acc: c.acc,
        },
        development: {
          is_booked: c.is_booked,
          is_book_needed: c.is_book_needed,
          has_mastery: c.has_mastery,
          is_mastery_needed: c.is_mastery_needed,
        },
        aura: c.aura ?? null,
        skills: c.skills ?? [],
        used_in: usedIn,
        priority: c.priority ?? null,
        champion_impact: c.champion_impact ?? null,
      };
    });

    const exportData = {
      export_date: new Date().toISOString().split("T")[0],
      total_champions: exportChampions.length,
      champions: exportChampions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raid_champions_${exportData.export_date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdd = () => {
    setEditingChampion(null);
    setShowModal(true);
  };
  const handleEdit = (champion: IChampion) => {
    setEditingChampion(champion);
    setShowModal(true);
  };
  const handleCloseModal = async (should_reload: boolean) => {
    setShowModal(false);
    setEditingChampion(null);
    if (should_reload) await loadChampions();
  };
  const handleFilterMode = (isTrue: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (isTrue) {
        next.set("filterOpen", "1");
      } else {
        next.delete("filterOpen");
        (Object.keys(initial_filter_info) as (keyof ChampionFilter)[]).forEach((key) => next.delete(key));
      }
      return next;
    }, { replace: true });
  };

  const duplicateOtherChampions = useMemo(
    () => findOtherChampionDuplicates(championList),
    [championList],
  );

  const handleRemoveDuplicates = async () => {
    setDedupeStatus("removing");
    const result = await removeChampions(duplicateOtherChampions);
    if (!result.success) {
      setDedupeStatus("error");
      return;
    }
    setDedupeStatus("idle");
    setShowDedupeConfirm(false);
    await loadChampions();
  };

  if (loading) return <ArcaneLoader label="Loading your roster" />;

  // Pill counts always reflect the pre-status list, so every pill stays a
  // valid, stable option to switch to regardless of which one is active.
  const total = baseFilteredChampions?.length ?? 0;
  const inUse = getCurrentlyInUseChampions(baseFilteredChampions ?? []).length;
  const { built, needsImprovement: improving, needsLevel, notBuilt, untouched } =
    getChampionBuildBreakdown(baseFilteredChampions ?? []);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Sticky header ── */}
        <div className="page-header flex-col md:flex-row">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Champions</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(
                [
                  { label: "Total",      value: total,      key: null,            color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
                  { label: "In Use",     value: inUse,      key: "in_use",        color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
                  { label: "Built",      value: built,      key: "built",         color: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400" },
                  { label: "Needs Work", value: improving,  key: "needs_work",    color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
                  { label: "Need Level", value: needsLevel, key: "needs_level",   color: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" },
                  { label: "Not Built",  value: notBuilt,   key: "not_built",     color: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
                  { label: "Untouched",  value: untouched,  key: "untouched",     color: "bg-gray-50 text-gray-400 dark:bg-gray-800/60 dark:text-gray-500" },
                ] as { label: string; value: number; key: BuildStatusKey | null; color: string }[]
              ).map(({ label, value, key, color }) => {
                const isActive = key === null ? buildStatus === null : buildStatus === key;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => (key === null ? clearBuildStatus() : setBuildStatus(key))}
                    title={key === null ? "Show all champions" : `Show only ${label} champions`}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition cursor-pointer ${color} ${
                      isActive ? "ring-2 ring-current" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {value} {label}
                  </button>
                );
              })}
            </div>

            {/* ── Stacked build-status bar ── */}
            {total > 0 && (() => {
              const segments = [
                { pct: (built      / total) * 100, bg: "bg-green-500", label: `Built ✓: ${built}` },
                { pct: (improving  / total) * 100, bg: "bg-amber-400", label: `Needs Work: ${improving}` },
                { pct: (needsLevel / total) * 100, bg: "bg-sky-400",   label: `Need Level: ${needsLevel}` },
                { pct: (notBuilt   / total) * 100, bg: "bg-red-400",   label: `Not Built: ${notBuilt}` },
                { pct: (untouched  / total) * 100, bg: "bg-gray-300",  label: `Untouched: ${untouched}` },
              ];
              return (
                <div className="flex h-1.5 rounded-full overflow-hidden mt-2 gap-px">
                  {segments.map(({ pct, bg, label }) =>
                    pct > 0 ? (
                      <Tooltip
                        key={label}
                        content={label}
                        className="block! transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      >
                        <div className={`h-full w-full ${bg}`} />
                      </Tooltip>
                    ) : null
                  )}
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onFilterMode ? (
              <>
                <SelectChampionFilter
                  filterInfo={filterInfo}
                  setFilterInfo={setFilterInfo}
                />
                <Tooltip content="Clear filters">
                  <button
                    type="button"
                    onClick={() => handleFilterMode(false)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                  >
                    <MdFilterAltOff size={22} />
                  </button>
                </Tooltip>
              </>
            ) : (
              <>
                <div className="relative">
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search…"
                    className="basic-input w-36 sm:w-48 pr-8"
                  />
                  {searchText ? (
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      <Tooltip content="Clear search">
                        <button
                          type="button"
                          onClick={() => setSearchText("")}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition cursor-pointer"
                        >
                          <MdClose size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  ) : (
                    <CiSearch
                      size={18}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  )}
                </div>
                <Tooltip content="Add champion">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                  >
                    <FaPlusSquare size={20} />
                  </button>
                </Tooltip>
                <div
                  ref={exportMenuRef}
                  className="relative"
                  onMouseEnter={() => setShowExportMenu(true)}
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <Tooltip content="Import or export champions">
                    <button
                      type="button"
                      onClick={() => setShowExportMenu((prev) => !prev)}
                      className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
                    >
                      <MdImportExport size={22} />
                    </button>
                  </Tooltip>

                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false);
                          navigate("/import-json");
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 transition cursor-pointer"
                      >
                        <FaFileImport size={13} /> Import JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExportMenu(false);
                          handleDownloadJson();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-400 transition cursor-pointer border-t border-gray-100 dark:border-gray-700"
                      >
                        <MdDownload size={14} /> Export JSON
                      </button>
                    </div>
                  )}
                </div>
                <Tooltip content="Filter">
                  <button
                    type="button"
                    onClick={() => handleFilterMode(true)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                  >
                    <MdFilterAlt size={22} />
                  </button>
                </Tooltip>
                <Tooltip content="Bulk edit">
                  <button
                    type="button"
                    onClick={() => setBulkMode(true)}
                    className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    <MdChecklist size={22} />
                  </button>
                </Tooltip>
                {duplicateOtherChampions.length > 0 && (
                  <Tooltip content="Remove duplicate Shard Log champions">
                    <button
                      type="button"
                      onClick={() => setShowDedupeConfirm(true)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                    >
                      <MdDeleteSweep size={22} />
                    </button>
                  </Tooltip>
                )}
              </>
            )}
            <Tooltip content="Dev tools">
              <button
                type="button"
                onClick={() => navigate("/dev-champions")}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                <TbTool size={20} />
              </button>
            </Tooltip>
            {bulkMode && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-violet-600">
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs px-2.5 py-1 rounded-lg border border-violet-300 text-violet-600 hover:bg-violet-50 transition cursor-pointer"
                >
                  {(filteredChampions ?? []).every((c) => selected.has(String(c.id)))
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <Tooltip content="Exit bulk edit">
                  <button
                    type="button"
                    onClick={exitBulkMode}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                  >
                    <MdClose size={20} />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredChampions?.length === 0 ? (
              <EmptyChampionList />
            ) : (
              filteredChampions?.map((champion) => {
                const sid = String(champion.id);
                const isSelected = selected.has(sid);
                return (
                  <Fragment key={champion.id}>
                    <div
                      className={`relative ${bulkMode ? "cursor-pointer select-none" : ""}`}
                      onClick={bulkMode && champion.id != null ? () => toggleSelect(champion.id!) : undefined}
                    >
                      {/* Selection ring + check */}
                      {bulkMode && (
                        <>
                          <div
                            className={`absolute inset-0 rounded-2xl z-10 pointer-events-none border-4 transition-all
                              ${isSelected ? "border-violet-500 bg-violet-500/5" : "border-gray-200 dark:border-gray-700"}`}
                          />
                          <div
                            className={`absolute top-2.5 left-2.5 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                              ${isSelected ? "bg-violet-500 border-violet-500" : "bg-white/90 border-gray-400"}`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </>
                      )}
                      <ChampionCard
                        champion={champion}
                        nsfw={nsfw}
                        onEdit={bulkMode ? undefined : handleEdit}
                        onDelete={bulkMode ? undefined : () => handleCloseModal(true)}
                      />
                    </div>
                  </Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ChampionModal
          champion={editingChampion ?? undefined}
          onClose={handleCloseModal}
        />
      )}

      {/* ── Remove duplicate "Other" champions ── */}
      <Modal
        isOpen={showDedupeConfirm}
        title="Remove Duplicate Champions"
        onClose={() => setShowDedupeConfirm(false)}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Found <span className="font-semibold">{duplicateOtherChampions.length}</span> duplicate champion{duplicateOtherChampions.length === 1 ? "" : "s"} with an unset (&quot;Other&quot;) type or faction — one copy per name is kept. The rest will be permanently deleted from this device and the cloud.
        </p>
        <ul className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-h-32 overflow-auto list-disc list-inside space-y-0.5">
          {duplicateOtherChampions.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
        {dedupeStatus === "error" && (
          <p className="text-sm text-red-500 mb-3">Failed to remove duplicates. Please try again.</p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setShowDedupeConfirm(false)}
            className="px-4 py-2 border dark:border-gray-700 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemoveDuplicates}
            disabled={dedupeStatus === "removing"}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition cursor-pointer font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {dedupeStatus === "removing" ? "Removing…" : "Remove Duplicates"}
          </button>
        </div>
      </Modal>

      {/* ── Bulk edit action bar ── */}
      {bulkMode && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 flex-wrap justify-center
          bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 border border-white/10 max-w-[95vw]">
          <span className="text-xs font-semibold text-gray-400 shrink-0">
            {selected.size} selected
          </span>
          <div className="w-px h-4 bg-white/20 shrink-0" />
          {(
            [
              { label: "+ Needs Book",    fields: { is_book_needed: true } },
              { label: "+ Needs Mastery", fields: { is_mastery_needed: true } },
              { label: "✓ Booked",        fields: { is_booked: true } },
              { label: "✓ Mastered",      fields: { has_mastery: true } },
            ] as { label: string; fields: Record<string, boolean> }[]
          ).map(({ label, fields }) => (
            <button
              key={label}
              type="button"
              disabled={selected.size === 0 || bulkUpdating}
              onClick={() => batchUpdate(fields)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20
                disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer whitespace-nowrap"
            >
              {bulkUpdating ? "…" : label}
            </button>
          ))}
          <div className="w-px h-4 bg-white/20 shrink-0" />
          <button
            type="button"
            onClick={exitBulkMode}
            className="text-xs px-3 py-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      )}
    </>
  );
}
