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

const initial_filter_info: ChampionFilter = {
  stat: "name",
  type: "type_all",
  role: "role_all",
  faction: "faction_all",
  rarity: "rarity_all",
  sortOrder: "desc",
};

export default function Champions() {
  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState<string>("");
  const [nsfw, setNsfw] = useState<boolean>(false);
  const [onFilterMode, setOnFilterMode] = useState<boolean>(false);

  const [filterInfo, setFilterInfo] =
    useState<ChampionFilter>(initial_filter_info);

  const [teams, setTeams] = useState<ITeam[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(
    null,
  );

  const loadChampions = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    if (forceRefresh) {
      localStorage.removeItem("supabase_champion_list");
      localStorage.removeItem("supabase_team_list");
    }

    await fetchChampions(); // ensures localStorage is up to date
    const generated = await generateChampions();
    setChampionList(generated);

    fetchTeams();

    setTimeout(() => setLoading(false), 400);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChampions();
  }, [loadChampions]);

  useEffect(() => {
    fetchTeams().then(setTeams);

    const setNsfwStatusFromLocal = () => setNsfw(getNsfwStatus());
    setNsfwStatusFromLocal();
  }, []);

  const filteredChampions = useMemo(() => {
    if (!onFilterMode) {
      if (!searchText) return championList;
      else {
        const lower = searchText.toLowerCase();
        return championList.filter((c) => c.name.toLowerCase().includes(lower));
      }
    } else {
      let filteredChampionList = [...championList];
      if (filterInfo.faction !== "faction_all")
        filteredChampionList = [...filteredChampionList].filter(
          (champion) => champion.faction === filterInfo.faction,
        );
      if (filterInfo.type !== "type_all")
        filteredChampionList = [...filteredChampionList].filter(
          (champion) => champion.type === filterInfo.type,
        );
      if (filterInfo.role !== "role_all")
        filteredChampionList = [...filteredChampionList].filter((champion) =>
          champion.role.includes(filterInfo.role as ChampionRole),
        );
      if (filterInfo.rarity !== "rarity_all")
        filteredChampionList = [...filteredChampionList].filter(
          (champion) => champion.rarity === filterInfo.rarity,
        );

      if (filterInfo.stat === "book_priority") {
        filteredChampionList = [
          ...sortByBookPriorityDesc(
            [...filteredChampionList],
            teams,
            ChampionRarity.MYTHICAL,
          ),
          ...sortByBookPriorityDesc(
            [...filteredChampionList],
            teams,
            ChampionRarity.LEGENDARY,
          ),
          ...sortByBookPriorityDesc(
            [...filteredChampionList],
            teams,
            ChampionRarity.EPIC,
          ),
          ...sortByBookPriorityDesc(
            [...filteredChampionList],
            teams,
            ChampionRarity.RARE,
          ),
          ...sortByBookPriorityDesc(
            [...filteredChampionList],
            teams,
            ChampionRarity.UNCOMMON,
          ),
        ];
        if (filterInfo.sortOrder === "desc") {
          return filteredChampionList;
        } else {
          return [...filteredChampionList].reverse();
        }
      }
      if (filterInfo.stat === "mastery_priority") {
        filteredChampionList = sortByMasteryPriorityDesc(
          [...filteredChampionList],
          teams,
        );
        if (filterInfo.sortOrder === "desc") {
          return filteredChampionList;
        } else {
          return [...filteredChampionList].reverse();
        }
      }

      if (filterInfo.stat) {
        filteredChampionList = sortChampions(
          [...filteredChampionList],
          filterInfo.stat,
          filterInfo.sortOrder,
        );
        return filteredChampionList;
      }
    }
  }, [
    onFilterMode,
    searchText,
    championList,
    filterInfo.faction,
    filterInfo.type,
    filterInfo.role,
    filterInfo.rarity,
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

  const handleRefresh = async () => {
    await loadChampions(true);
  };

  const handleFilterMode = (isTrue: boolean) => {
    if (isTrue) {
      setOnFilterMode(true);
    } else {
      setFilterInfo(initial_filter_info);
      setOnFilterMode(false);
    }
  };

  if (loading) return <ChampionSkeletonLoader />;

  return (
    <>
      <div className="overflow-auto h-[92vh]">
        {/* Header */}
        <div className="flex-between sticky top-0 bg-white z-20">
          <div>
            <h1 className="text-xl border-b">Champions List</h1>
            <p className="text-sm flex-center gap-2 uppercase">
              <span className="border-r border-gray-300 pr-2">
                Total {filteredChampions?.length}
              </span>
              <span className="border-r border-gray-300 pr-2">
                {getCurrentlyInUseChampions(filteredChampions ?? []).length} in
                use
              </span>
              <span>
                {getBuiltChampionsCount(filteredChampions ?? [])} built
              </span>
            </p>
          </div>

          <div className="m-2 flex-center gap-2">
            {onFilterMode ? (
              <Fragment>
                <SelectChampionFilter
                  filterInfo={filterInfo}
                  setFilterInfo={setFilterInfo}
                />
                <MdFilterAltOff
                  title="Filter-Off"
                  size={36}
                  className="cursor-pointer hover:text-gray-500 transition"
                  onClick={() => handleFilterMode(false)}
                />
              </Fragment>
            ) : (
              <Fragment>
                <div className="relative">
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search Champion..."
                    className="basic-input w-full max-w-sm"
                  />
                  <CiSearch
                    size={22}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                <FaPlusSquare
                  title="Add"
                  size={36}
                  className="cursor-pointer hover:text-gray-500 transition"
                  onClick={handleAdd}
                />

                <TbRefreshDot
                  title="Refresh"
                  size={36}
                  className="cursor-pointer hover:text-gray-500 transition"
                  onClick={handleRefresh}
                />
                <MdFilterAlt
                  title="Filter"
                  size={36}
                  className="cursor-pointer hover:text-gray-500 transition"
                  onClick={() => handleFilterMode(true)}
                />
              </Fragment>
            )}
          </div>
        </div>

        <hr className="my-2" />

        {/* Champion grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredChampions?.length === 0 ? (
            <EmptyChampionList />
          ) : (
            filteredChampions?.map((champion) => (
              <Fragment key={champion.id}>
                <ChampionCard
                  champion={champion}
                  nsfw={nsfw}
                  onEdit={handleEdit}
                  onDelete={() => handleCloseModal(true)}
                />
              </Fragment>
            ))
          )}
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
