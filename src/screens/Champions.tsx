import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FaPlusSquare } from "react-icons/fa";
import { TbRefreshDot } from "react-icons/tb";
import { CiSearch } from "react-icons/ci";

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
import { getShowSkillsStatus } from "../helpers/getShowSkillsStatus";

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
  const [showSkills, setShowSkills] = useState<boolean>(false);
  const [onFilterMode, setOnFilterMode] = useState<boolean>(false);
  const [filterInfo, setFilterInfo] = useState<ChampionFilter>(initial_filter_info);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);

  const loadChampions = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) {
      localStorage.removeItem("supabase_champion_list");
      localStorage.removeItem("supabase_team_list");
    }
    await fetchChampions();
    const generated = await generateChampions();
    setChampionList(generated);
    fetchTeams();
    setTimeout(() => setLoading(false), 400);
  }, []);

  useEffect(() => {
    loadChampions();
  }, [loadChampions]);

  useEffect(() => {
    fetchTeams().then(setTeams);
    setNsfw(getNsfwStatus());
    setShowSkills(getShowSkillsStatus());
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
      list = list.filter((c) => c.role.includes(filterInfo.role as ChampionRole));
    if (filterInfo.rarity !== "rarity_all")
      list = list.filter((c) => c.rarity === filterInfo.rarity);
    if (filterInfo.buff)
      list = list.filter((c) =>
        c.skills?.some((s) =>
          s.effects?.some((e) => e.type === "buff" && e.name === filterInfo.buff),
        ),
      );
    if (filterInfo.debuff)
      list = list.filter((c) =>
        c.skills?.some((s) =>
          s.effects?.some((e) => e.type === "debuff" && e.name === filterInfo.debuff),
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
    onFilterMode, searchText, championList,
    filterInfo.faction, filterInfo.type, filterInfo.role, filterInfo.rarity,
    filterInfo.buff, filterInfo.debuff, filterInfo.aura,
    filterInfo.stat, filterInfo.sortOrder, teams,
  ]);

  const handleAdd = () => { setEditingChampion(null); setShowModal(true); };
  const handleEdit = (champion: IChampion) => { setEditingChampion(champion); setShowModal(true); };
  const handleCloseModal = async (should_reload: boolean) => {
    setShowModal(false);
    setEditingChampion(null);
    if (should_reload) await loadChampions();
  };
  const handleFilterMode = (isTrue: boolean) => {
    if (isTrue) setOnFilterMode(true);
    else { setFilterInfo(initial_filter_info); setOnFilterMode(false); }
  };

  if (loading) return <ChampionSkeletonLoader />;

  const total = filteredChampions?.length ?? 0;
  const inUse = getCurrentlyInUseChampions(filteredChampions ?? []).length;
  const built = getBuiltChampionsCount(filteredChampions ?? []);
  const untouched = (filteredChampions ?? []).filter((c) => c.spd <= 120).length;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Sticky header ── */}
        <div className="page-header">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900">Champions</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[
                { label: "Total", value: total, color: "bg-gray-100 text-gray-600" },
                { label: "In Use", value: inUse, color: "bg-blue-50 text-blue-600" },
                { label: "Built", value: built, color: "bg-green-50 text-green-600" },
                { label: "Untouched", value: untouched, color: "bg-gray-50 text-gray-400" },
              ].map(({ label, value, color }) => (
                <span
                  key={label}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}
                >
                  {value} {label}
                </span>
              ))}
            </div>
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
              </>
            )}
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredChampions?.length === 0 ? (
              <EmptyChampionList />
            ) : (
              filteredChampions?.map((champion) => (
                <Fragment key={champion.id}>
                  <ChampionCard
                    champion={champion}
                    nsfw={nsfw}
                    showSkills={showSkills}
                    onEdit={handleEdit}
                    onDelete={() => handleCloseModal(true)}
                  />
                </Fragment>
              ))
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
    </>
  );
}
