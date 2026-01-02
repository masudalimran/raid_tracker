import { Fragment, useEffect, useState } from "react";
import { FaEdit, FaPlusSquare } from "react-icons/fa";
import type IChampion from "../../models/IChampion";
import type ITeam from "../../models/ITeam";
import {
  fetchChampions,
  generateChampions,
} from "../../helpers/handleChampions";
import { fetchSingleTeam } from "../../helpers/handleTeams";
import ChampionSkeletonLoader from "../loaders/ChampionSkeletonLoader";
import ChampionCard from "../card/ChampionCard";
import TeamModal from "../modals/TeamModal";
import ChampionModal from "../modals/ChampionModal";
import { sortBySpeedDesc } from "../../helpers/sortChampions";
import type { TeamIdentifier } from "../../data/team_priority_weight";

interface BaseAreaTeamProps {
  title: string;
  teamKey: TeamIdentifier;
  isFaction: boolean;
  maxChampions: number;
}

export default function BaseAreaTeam({
  title,
  teamKey,
  isFaction,
  maxChampions,
}: BaseAreaTeamProps) {
  const [loading, setLoading] = useState(true);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(
    null
  );
  const [reloadDetector, setReloadDetector] = useState<boolean>(false);

  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [teamChampionList, setTeamChampionList] = useState<IChampion[]>([]);
  const [team, setTeam] = useState<ITeam | undefined>(undefined);

  const onModalClose = (should_reload: boolean) => {
    setShowTeamModal(false);
    setShowChampionModal(false);
    if (should_reload) setReloadDetector((prev) => !prev);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let champions = await fetchChampions();
      champions = generateChampions();

      if (isFaction) {
        setChampionList(
          champions.filter((champion) => champion.faction === title)
        );
      } else {
        setChampionList(champions);
      }

      const fetchedTeam = await fetchSingleTeam(teamKey);
      setTeam(fetchedTeam);

      if (fetchedTeam) {
        const mapped = fetchedTeam.champion_ids
          .map((id) => champions.find((c) => c.id === id))
          .filter(Boolean) as IChampion[];

        setTeamChampionList(sortBySpeedDesc(mapped));
      } else setTeamChampionList([]);

      setTimeout(() => setLoading(false), 500);
    };

    load();
  }, [teamKey, reloadDetector]);

  if (loading) return <ChampionSkeletonLoader length={maxChampions} />;

  return (
    <>
      <div className="overflow-auto h-[92vh]">
        <div className="flex-between sticky top-0 bg-white z-20">
          <h1 className="text-xl">
            {title}{" "}
            {team?.clearing_stage && (
              <span className="ml-1 basic-padding bg-black text-white">
                {team.clearing_stage}
              </span>
            )}
          </h1>

          {team ? (
            <FaEdit
              size={36}
              className="cursor-pointer"
              onClick={() => setShowTeamModal(true)}
            />
          ) : (
            <FaPlusSquare
              size={36}
              className="cursor-pointer"
              onClick={() => setShowTeamModal(true)}
            />
          )}
        </div>

        <hr className="my-2" />

        {team?.notes && (
          <div>
            <p className="text-red-400">{team.notes}</p>
            <hr className="my-2" />
          </div>
        )}

        <div className="grid sm:grid-cols-1 md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {teamChampionList.map((champion) => (
            <Fragment key={champion.id}>
              <ChampionCard
                champion={champion}
                onEdit={(c) => {
                  setEditingChampion(c);
                  setShowChampionModal(true);
                }}
                onDelete={() => setShowChampionModal(false)}
              />
            </Fragment>
          ))}
        </div>
      </div>

      {showTeamModal && (
        <TeamModal
          teamName={teamKey}
          championList={championList}
          maxChampions={maxChampions}
          team={team}
          onClose={onModalClose}
        />
      )}

      {showChampionModal && (
        <ChampionModal
          champion={editingChampion ?? undefined}
          onClose={onModalClose}
        />
      )}
    </>
  );
}
