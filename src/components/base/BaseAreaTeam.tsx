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
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);
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
      let champs = await fetchChampions();
      champs = await generateChampions();
      setChampions(champs);
      if (isHydra) fetchTeams().then(setTeams);
    };
    load();
  }, [isHydra, teamKey]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      if (isFaction) {
        setChampionList(champions.filter((c) => c.faction === title));
      } else if (isHydra) {
        const hydraTeamKeys = [
          toSlug(HYDRA.HYDRA_A),
          toSlug(HYDRA.HYDRA_B),
          toSlug(HYDRA.HYDRA_C),
        ];
        const hydraTeams = teams.filter((t) => hydraTeamKeys.includes(t.team_name));
        const currentHydraTeam = hydraTeams.find(
          (t) => t.team_name === teamKey.toLowerCase(),
        );
        const otherHydraTeams = hydraTeams.filter(
          (t) => t.team_name !== teamKey.toLowerCase(),
        );
        const currentHydraTeamChampionIds = currentHydraTeam?.champion_ids ?? [];
        const blockedChampionIds = otherHydraTeams.flatMap((t) => t.champion_ids);

        setChampionList(
          champions.filter((c) => {
            if (!c?.id) return false;
            const id = String(c.id);
            return !blockedChampionIds.includes(id) || currentHydraTeamChampionIds.includes(id);
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
    setNsfw(getNsfwStatus());
  }, []);

  if (loading) return <ChampionSkeletonLoader length={maxChampions} />;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Header ── */}
        <div className="page-header">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
            {team?.clearing_stage && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                {team.clearing_stage}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0
              ${team
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "btn-primary"
              }`}
          >
            {team ? (
              <><FaEdit size={13} /> Edit Team</>
            ) : (
              <><FaPlusSquare size={13} /> Add Team</>
            )}
          </button>
        </div>

        {/* ── Notes ── */}
        {team?.notes && (
          <div className="mx-4 mt-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {team.notes}
          </div>
        )}

        {/* ── Grid ── */}
        <div className="flex-1 overflow-auto p-4">
          {teamChampionList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-3xl mb-2">⚔️</p>
              <p className="text-gray-500 text-sm font-medium">No champions in this team yet.</p>
              <p className="text-gray-400 text-xs mt-1">Add a team to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
          )}
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
