import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FaPlusSquare } from "react-icons/fa";
import { TbRefreshDot } from "react-icons/tb";
import { CiSearch } from "react-icons/ci";

import ChampionCard from "../components/card/ChampionCard";
import ChampionModal from "../components/modals/ChampionModal";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";

import type IChampion from "../models/IChampion";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";

export default function Champions() {
  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [nsfw, setNsfw] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(
    null
  );

  const loadChampions = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    if (forceRefresh) {
      localStorage.removeItem("supabase_champion_list");
    }

    await fetchChampions(); // ensures localStorage is up to date
    const generated = generateChampions();
    setChampionList(generated);

    setTimeout(() => setLoading(false), 400);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChampions();
  }, [loadChampions]);

  const filteredChampions = useMemo(() => {
    if (!searchText) return championList;

    const lower = searchText.toLowerCase();
    return championList.filter((c) => c.name.toLowerCase().includes(lower));
  }, [searchText, championList]);

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

  if (loading) return <ChampionSkeletonLoader />;

  return (
    <>
      <div className="overflow-scroll h-[92vh]">
        {/* Header */}
        <div className="flex-between sticky top-0 bg-white z-20">
          <h1 className="text-3xl">
            Champions List ({filteredChampions.length})
          </h1>

          <div className="m-2 flex-center gap-2">
            <button
              type="button"
              className={`font-bold text-sm border basic-padding-xs transition shadow-2xl ${
                nsfw
                  ? "line-through bg-black text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => setNsfw((v) => !v)}
            >
              NSFW
            </button>

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
          </div>
        </div>

        <hr className="my-2" />

        {/* Champion grid */}
        <div className="flex justify-start flex-wrap gap-8">
          {filteredChampions.map((champion) => (
            <Fragment key={champion.id}>
              <ChampionCard
                champion={champion}
                nsfw={nsfw}
                onEdit={handleEdit}
                onDelete={() => handleCloseModal(true)}
              />
            </Fragment>
          ))}
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
