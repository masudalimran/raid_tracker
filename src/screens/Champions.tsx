import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FaPlusSquare } from "react-icons/fa";
import { TbRefreshDot } from "react-icons/tb";
import { CiSearch } from "react-icons/ci";
import { MdChecklist, MdClose } from "react-icons/md";
import { supabase } from "../lib/supabaseClient";

import ChampionCard from "../components/card/ChampionCard";
import ChampionModal from "../components/modals/ChampionModal";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";

import type IChampion from "../models/IChampion";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import { MdFilterAlt, MdFilterAltOff } from "react-icons/md";
import SelectChampionFilter from "../components/forms/inputs/SelectChampionFilter";
import type { ChampionFilter } from "../models/ChampionFilter";
import {
  sortByBookPriorityDesc,
  sortByMasteryPriorityDesc,
  sortChampions,
} from "../helpers/sortChampions";
import { ChampionRarity } from "../models/ChampionRarity";
import type ITeam from "../models/ITeam";
import EmptyChampionList from "../components/empty/EmptyChampionList";
import type { ChampionRole } from "../models/ChampionRole";
import { getNsfwStatus } from "../helpers/getNsfwStatus";
import { getCurrentlyInUseChampions } from "../helpers/getChampionsInUse";
import { getBuiltChampionsCount } from "../helpers/getChampionsBuilt";
// import { getShowSkillsStatus } from "../helpers/getShowSkillsStatus"; // skills hidden
import { needsImprovement } from "../helpers/getChampionBuildQuality";
import { checkIfChampionIsBuilt } from "../helpers/checkIfChampionIsBuilt";
import { clearRoleReqCache } from "../helpers/teamRoleOverrides";

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
  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState<string>("");
  const [nsfw, setNsfw] = useState<boolean>(false);
  // const [showSkills, setShowSkills] = useState<boolean>(false); // skills hidden
  const [onFilterMode, setOnFilterMode] = useState<boolean>(false);
  const [filterInfo, setFilterInfo] =
    useState<ChampionFilter>(initial_filter_info);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);

  // Bulk edit
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

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

  const loadChampions = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) {
      localStorage.removeItem("supabase_champion_list");
      localStorage.removeItem("supabase_team_list");
      localStorage.removeItem("supabase_rsl_account_list");
      clearRoleReqCache();
    }

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

  const filteredChampions = useMemo(() => {
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
    if (isTrue) setOnFilterMode(true);
    else {
      setFilterInfo(initial_filter_info);
      setOnFilterMode(false);
    }
  };

  if (loading) return <ChampionSkeletonLoader />;

  const total = filteredChampions?.length ?? 0;
  const inUse = getCurrentlyInUseChampions(filteredChampions ?? []).length;
  const built = getBuiltChampionsCount(filteredChampions ?? []);
  const untouched = (filteredChampions ?? []).filter((c) => c.spd <= 120).length;
  const improving = (filteredChampions ?? []).filter(
    (c) => checkIfChampionIsBuilt(c) && needsImprovement(c),
  ).length;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Sticky header ── */}
        <div className="page-header flex-col md:flex-row">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900">Champions</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[
                { label: "Total",      value: total,    color: "bg-gray-100 text-gray-600" },
                { label: "In Use",     value: inUse,    color: "bg-blue-50 text-blue-600" },
                { label: "Built",      value: built,    color: "bg-green-50 text-green-600" },
                { label: "Needs Work", value: improving, color: "bg-amber-50 text-amber-600" },
                { label: "Untouched",  value: untouched, color: "bg-gray-50 text-gray-400" },
              ].map(({ label, value, color }) => (
                <span
                  key={label}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}
                >
                  {value} {label}
                </span>
              ))}
            </div>

            {/* ── Stacked build-status bar ── */}
            {total > 0 && (() => {
              const perfectBuilt = built - improving;
              const notBuilt     = total - built - untouched;
              const segments = [
                { pct: (perfectBuilt / total) * 100, bg: "bg-green-500", label: `Built ✓: ${perfectBuilt}` },
                { pct: (improving    / total) * 100, bg: "bg-amber-400", label: `Needs Work: ${improving}` },
                { pct: (notBuilt     / total) * 100, bg: "bg-red-400",   label: `Not Built: ${notBuilt}` },
                { pct: (untouched    / total) * 100, bg: "bg-gray-300",  label: `Untouched: ${untouched}` },
              ];
              return (
                <div className="flex h-1.5 rounded-full overflow-hidden mt-2 gap-px">
                  {segments.map(({ pct, bg, label }) =>
                    pct > 0 ? (
                      <div
                        key={label}
                        title={label}
                        className={`${bg} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
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
                <button
                  type="button"
                  title="Clear filters"
                  onClick={() => handleFilterMode(false)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                >
                  <MdFilterAltOff size={22} />
                </button>
              </>
            ) : (
              <>
                <div className="relative">
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search…"
                    className="basic-input w-36 sm:w-48"
                  />
                  <CiSearch
                    size={18}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
                <button
                  type="button"
                  title="Add champion"
                  onClick={handleAdd}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition"
                >
                  <FaPlusSquare size={20} />
                </button>
                <button
                  type="button"
                  title="Refresh"
                  onClick={() => loadChampions(true)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                >
                  <TbRefreshDot size={22} />
                </button>
                <button
                  type="button"
                  title="Filter"
                  onClick={() => handleFilterMode(true)}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition"
                >
                  <MdFilterAlt size={22} />
                </button>
                <button
                  type="button"
                  title="Bulk edit"
                  onClick={() => setBulkMode(true)}
                  className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition"
                >
                  <MdChecklist size={22} />
                </button>
              </>
            )}
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
                <button
                  type="button"
                  onClick={exitBulkMode}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                  title="Exit bulk edit"
                >
                  <MdClose size={20} />
                </button>
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
                              ${isSelected ? "border-violet-500 bg-violet-500/5" : "border-gray-200"}`}
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
