import { Fragment, useEffect, useState } from "react";
import { FaEdit, FaPlusSquare } from "react-icons/fa";
import type IChampion from "../../models/IChampion";
import type ITeam from "../../models/ITeam";
import {
  fetchChampions,
  generateChampions,
} from "../../helpers/handleChampions";
import { fetchSingleTeam, fetchTeams } from "../../helpers/handleTeams";
import ChampionSkeletonLoader from "../loaders/ChampionSkeletonLoader";
import ChampionCard from "../card/ChampionCard";
import TeamModal from "../modals/TeamModal";
import ChampionModal from "../modals/ChampionModal";
import { sortBySpeedDesc } from "../../helpers/sortChampions";
import type { TeamIdentifier } from "../../data/team_priority_weight";
import { getNsfwStatus } from "../../helpers/getNsfwStatus";
import { HYDRA } from "../../models/game_areas/Hydra";
import toSlug from "../../helpers/toSlug";

interface BaseAreaTeamProps {
  title: string;
  teamKey: TeamIdentifier;
  isFaction: boolean;
  isHydra?: boolean;
  maxChampions: number;
}

export default function BaseAreaTeam({
  title,
  teamKey,
  isFaction,
  isHydra = false,
  maxChampions,
}: BaseAreaTeamProps) {
  const [loading, setLoading] = useState(true);
  const [nsfw, setNsfw] = useState<boolean>(false);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(
    null,
  );
  const [reloadDetector, setReloadDetector] = useState<boolean>(false);

  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [teamChampionList, setTeamChampionList] = useState<IChampion[]>([]);

  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [team, setTeam] = useState<ITeam | undefined>(undefined);

  const onModalClose = (should_reload: boolean) => {
    setShowTeamModal(false);
    setShowChampionModal(false);
    if (should_reload) setReloadDetector((prev) => !prev);
  };

  useEffect(() => {
    const load = async () => {
      let champions = await fetchChampions();
      champions = await generateChampions();
      setChampions(champions);

      if (isHydra) {
        fetchTeams().then(setTeams);
      }
    };
    load();
  }, [isHydra, teamKey]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      if (isFaction) {
        setChampionList(
          champions.filter((champion) => champion.faction === title),
        );
      } else if (isHydra) {
        const hydraTeamKeys = [
          toSlug(HYDRA.HYDRA_A),
          toSlug(HYDRA.HYDRA_B),
          toSlug(HYDRA.HYDRA_C),
        ];

        const hydraTeams = teams.filter((team) =>
          hydraTeamKeys.includes(team.team_name),
        );

        const currentHydraTeam = hydraTeams.find(
          (team) => team.team_name === teamKey.toLowerCase(),
        );

        const otherHydraTeams = hydraTeams.filter(
          (team) => team.team_name !== teamKey.toLowerCase(),
        );

        const currentHydraTeamChampionIds =
          currentHydraTeam?.champion_ids ?? [];

        const blockedChampionIds = otherHydraTeams.flatMap(
          (team) => team.champion_ids,
        );

        setChampionList(
          champions.filter((champion) => {
            if (!champion?.id) return false;
            const championIdString = String(champion.id);
            const usedInOtherHydraTeam =
              blockedChampionIds.includes(championIdString);
            const alreadyInCurrentTeam =
              currentHydraTeamChampionIds.includes(championIdString);

            return !usedInOtherHydraTeam || alreadyInCurrentTeam;
          }),
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
  }, [teamKey, reloadDetector, isFaction, title, isHydra, champions, teams]);

  useEffect(() => {
    const setNsfwStatusFromLocal = () => setNsfw(getNsfwStatus());
    setNsfwStatusFromLocal();
  }, []);

  if (loading) return <ChampionSkeletonLoader length={maxChampions} />;

  return (
    <>
      <div className="overflow-auto h-[92vh]">
        <div className="flex-between sticky top-0 bg-white z-30">
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
                nsfw={nsfw}
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
