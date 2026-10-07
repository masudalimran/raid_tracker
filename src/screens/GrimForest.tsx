import { useEffect, useState } from "react";
import { FaEdit, FaPlusSquare } from "react-icons/fa";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import ChampionCard from "../components/card/ChampionCard";
import GrimForestDeckCard from "../components/card/GrimForestDeckCard";
import GrimForestTeamModal from "../components/modals/GrimForestTeamModal";
import ChampionModal from "../components/modals/ChampionModal";
import Modal from "../components/modals/Modal";
import Tooltip from "../components/utility/Tooltip";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import {
  checkTeamCoverage,
  getTeamRequirements,
} from "../data/areaRoleRequirements";
import {
  GRIM_FOREST_DECK_1_SLUG,
  GRIM_FOREST_DECK_2_SLUG,
  GRIM_FOREST_DECK_SIZE,
} from "../models/game_areas/GrimForest";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";

function DeckPanel({
  title,
  team,
  champions,
  onPreview,
}: {
  title: string;
  team: ITeam | undefined;
  champions: IChampion[];
  onPreview: (champion: IChampion) => void;
}) {
  const requiredRoles = getTeamRequirements("GRIM_FOREST_DECK_1");
  const coverage = checkTeamCoverage(requiredRoles, champions);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-sm">{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {champions.length}/{GRIM_FOREST_DECK_SIZE}
        </span>
      </div>

      {requiredRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {coverage.map(({ req, coveredBy }) => (
            <Tooltip
              key={req.label}
              content={
                <>
                  <div>{req.tip}</div>
                  <div className={coveredBy.length > 0 ? "text-green-300 mt-1" : "text-gray-400 mt-1"}>
                    {coveredBy.length > 0 ? `Covered by: ${coveredBy.join(", ")}` : "Not detected in this deck"}
                  </div>
                </>
              }
            >
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border
                  ${coveredBy.length > 0
                    ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-400"
                    : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700"}`}
              >
                <span>{coveredBy.length > 0 ? "✓" : "✗"}</span>
                <span>{req.label}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      )}

      {champions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-2xl mb-1">🌲</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">No champions in this deck yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {champions.map((champion) => (
            <GrimForestDeckCard
              key={String(champion.id)}
              champion={champion}
              requiredRoles={requiredRoles}
              onClick={() => onPreview(champion)}
            />
          ))}
        </div>
      )}

      {team?.notes && (
        <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
          {team.notes}
        </p>
      )}
    </div>
  );
}

export default function GrimForest() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [previewChampion, setPreviewChampion] = useState<IChampion | null>(null);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [reloadDetector, setReloadDetector] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchChampions();
      const [champs, fetchedTeams] = await Promise.all([generateChampions(), fetchTeams()]);
      setChampions(champs);
      setTeams(fetchedTeams);
      setLoading(false);
    };
    load();
  }, [reloadDetector]);

  if (loading) return <ArcaneLoader label="Loading your decks" />;

  const deck1Team = teams.find((t) => t.team_name === GRIM_FOREST_DECK_1_SLUG);
  const deck2Team = teams.find((t) => t.team_name === GRIM_FOREST_DECK_2_SLUG);

  const resolveChampions = (team: ITeam | undefined): IChampion[] =>
    (team?.champion_ids ?? [])
      .map((id) => champions.find((c) => String(c.id) === String(id)))
      .filter(Boolean) as IChampion[];

  const deck1Champions = resolveChampions(deck1Team);
  const deck2Champions = resolveChampions(deck2Team);
  const clearingStage = deck1Team?.clearing_stage ?? deck2Team?.clearing_stage;
  const hasAnyTeam = !!deck1Team || !!deck2Team;

  const handleEditChampion = (champion: IChampion) => {
    setPreviewChampion(null);
    setEditingChampion(champion);
    setShowChampionModal(true);
  };
  const handleChampionModalClose = (shouldReload: boolean) => {
    setShowChampionModal(false);
    setEditingChampion(null);
    if (shouldReload) setReloadDetector((prev) => !prev);
  };
  const handleDeletePreviewChampion = () => {
    setPreviewChampion(null);
    setReloadDetector((prev) => !prev);
  };
  const handleTeamModalClose = (shouldReload: boolean) => {
    setShowTeamModal(false);
    if (shouldReload) setReloadDetector((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">Grim Forest</h1>
          {clearingStage && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 shrink-0">
              {clearingStage}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowTeamModal(true)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0
            ${hasAnyTeam
              ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              : "btn-primary"
            }`}
        >
          {hasAnyTeam ? (
            <><FaEdit size={13} /> Edit Decks</>
          ) : (
            <><FaPlusSquare size={13} /> Add Decks</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        <p className="text-xs text-gray-400 -mt-1">
          2 decks of up to {GRIM_FOREST_DECK_SIZE} champions each — no champion can be in both decks at once.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DeckPanel title="Deck 1" team={deck1Team} champions={deck1Champions} onPreview={setPreviewChampion} />
          <DeckPanel title="Deck 2" team={deck2Team} champions={deck2Champions} onPreview={setPreviewChampion} />
        </div>
      </div>

      {showTeamModal && (
        <GrimForestTeamModal
          deck1Team={deck1Team}
          deck2Team={deck2Team}
          champions={champions}
          onClose={handleTeamModalClose}
        />
      )}

      {showChampionModal && (
        <ChampionModal champion={editingChampion ?? undefined} onClose={handleChampionModalClose} />
      )}

      {previewChampion && (
        <Modal isOpen bare maxWidthClass="max-w-xs" onClose={() => setPreviewChampion(null)}>
          <ChampionCard
            champion={previewChampion}
            onEdit={handleEditChampion}
            onDelete={handleDeletePreviewChampion}
          />
        </Modal>
      )}
    </div>
  );
}
