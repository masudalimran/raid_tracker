import { Fragment, useEffect, useState } from "react";
import { ChampionRarity } from "../models/ChampionRarity";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";
import {
  sortByBookPriorityDesc,
  sortByMasteryPriorityDesc,
} from "../helpers/sortChampions";
import ChampionCard from "../components/card/ChampionCard";
import ChampionModal from "../components/modals/ChampionModal";
import ChampionSkeletonCard from "../components/card/ChampionSkeletonCard";

export default function Home() {
  const [loading, setLoading] = useState(true);

  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);

  console.log(championList);
  console.log(teamList);

  const [reloadDetector, setReloadDetector] = useState<boolean>(false);

  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(
    null
  );

  const handleEdit = (champion: IChampion) => {
    setEditingChampion(champion);
    setShowModal(true);
  };

  const handleCloseModal = async (should_reload: boolean) => {
    setShowModal(false);
    setEditingChampion(null);
    if (should_reload) setReloadDetector((prev) => !prev);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let champions = await fetchChampions();
      champions = generateChampions();
      setChampionList(champions);

      const teams = await fetchTeams();
      setTeamList(teams);

      setTimeout(() => setLoading(false), 500);
    };

    load();
  }, [reloadDetector]);

  if (loading) return <ChampionSkeletonLoader />;

  return (
    <>
      <div className="overflow-scroll h-[92vh]">
        <h1 className="text-2xl font-semibold">Book Priority</h1>
        <hr className="py-2" />
        <h2 className="text-xl pb-2">{ChampionRarity.LEGENDARY}</h2>

        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-stretch">
          {[
            ...sortByBookPriorityDesc(
              championList,
              teamList,
              ChampionRarity.LEGENDARY
            ),
          ].map((champion) => (
            <Fragment key={champion.id}>
              <ChampionCard
                champion={champion}
                onEdit={handleEdit}
                onDelete={() => handleCloseModal(true)}
              />
            </Fragment>
          ))}
          {Array.from({
            length:
              5 -
              sortByBookPriorityDesc(
                championList,
                teamList,
                ChampionRarity.LEGENDARY
              ).length,
          }).map((_, idx) => (
            <Fragment key={idx}>
              <ChampionSkeletonCard fullWidth />
            </Fragment>
          ))}
        </div>
        <h2 className="text-xl pb-2">{ChampionRarity.EPIC}</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-stretch">
          {[
            ...sortByBookPriorityDesc(
              championList,
              teamList,
              ChampionRarity.EPIC
            ),
          ].map((champion) => (
            <Fragment key={champion.id}>
              <ChampionCard
                champion={champion}
                onEdit={handleEdit}
                onDelete={() => handleCloseModal(true)}
              />
            </Fragment>
          ))}
          {Array.from({
            length:
              5 -
              sortByBookPriorityDesc(
                championList,
                teamList,
                ChampionRarity.EPIC
              ).length,
          }).map((_, idx) => (
            <Fragment key={idx}>
              <ChampionSkeletonCard fullWidth />
            </Fragment>
          ))}
        </div>
        <h2 className="text-xl pb-2">{ChampionRarity.RARE}</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-stretch">
          {[
            ...sortByBookPriorityDesc(
              championList,
              teamList,
              ChampionRarity.RARE
            ),
          ].map((champion) => (
            <Fragment key={champion.id}>
              <ChampionCard
                champion={champion}
                onEdit={handleEdit}
                onDelete={() => handleCloseModal(true)}
              />
            </Fragment>
          ))}
          {Array.from({
            length:
              5 -
              sortByBookPriorityDesc(
                championList,
                teamList,
                ChampionRarity.RARE
              ).length,
          }).map((_, idx) => (
            <Fragment key={idx}>
              <ChampionSkeletonCard fullWidth />
            </Fragment>
          ))}
        </div>

        <h1 className="text-2xl font-semibold">Mastery Priority</h1>
        <hr className="py-2" />
        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-stretch">
          {[...sortByMasteryPriorityDesc(championList, teamList)].map(
            (champion) => (
              <Fragment key={champion.id}>
                <ChampionCard
                  champion={champion}
                  onEdit={handleEdit}
                  onDelete={() => handleCloseModal(true)}
                />
              </Fragment>
            )
          )}
          {Array.from({
            length:
              5 - sortByMasteryPriorityDesc(championList, teamList).length,
          }).map((_, idx) => (
            <Fragment key={idx}>
              <ChampionSkeletonCard fullWidth />
            </Fragment>
          ))}
        </div>

        {/* <h1 className="text-2xl font-semibold">Level Up Priority</h1>
        <hr className="py-2" />
        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-stretch">
          {[...sortByMasteryPriorityDesc(championList, teamList)].map(
            (champion) => (
              <Fragment key={champion.id}>
                <ChampionCard
                  champion={champion}
                  onEdit={handleEdit}
                  onDelete={() => handleCloseModal(true)}
                />
              </Fragment>
            )
          )}
          {Array.from({
            length:
              5 - sortByMasteryPriorityDesc(championList, teamList).length,
          }).map((_, idx) => (
            <Fragment key={idx}>
              <ChampionSkeletonCard fullWidth />
            </Fragment>
          ))}
        </div> */}
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
