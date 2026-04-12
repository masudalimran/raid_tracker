import type IChampion from "../../models/IChampion.ts";
import ChampionStar from "../utility/ChampionStar.tsx";
import { formatNumber } from "../../helpers/formatNumber.ts";
import {
  FaCheckCircle,
  FaEdit,
  FaInfoCircle,
  FaRegHourglass,
  FaTrash,
} from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { checkIfChampionIsBuilt } from "../../helpers/checkIfChampionIsBuilt.ts";
import { ChampionType } from "../../models/ChampionType.ts";
import {
  ChampionRole,
  ChampionRoleImageMap,
} from "../../models/ChampionRole.ts";
import { useState } from "react";
import Modal from "../modals/Modal.tsx";
import { useChampion } from "../../hooks/useChampion.ts";
import type ITeam from "../../models/ITeam.ts";
import { fromSlug } from "../../helpers/fromSlug.ts";
import colorByRarity from "../../helpers/colorByRarity.ts";
import getFactionLogo from "../../helpers/getFactionLogo.ts";
import type { Skill } from "../../models/IChampion.ts";
import { LuRefreshCw } from "react-icons/lu";
import { BsDice6Fill } from "react-icons/bs";

interface ChampionCardProps {
  champion: IChampion;
  onEdit?: (champion: IChampion) => void;
  onDelete?: () => void;
  nsfw?: boolean;
  showSkills?: boolean;
}

export default function ChampionCard({
  champion,
  onEdit,
  onDelete,
  nsfw = false,
  showSkills = false,
}: ChampionCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [showAllSkills, setShowAllSkills] = useState<boolean>(false);
  const { deleteChampion, loading } = useChampion();

  const supabase_team_list: ITeam[] = JSON.parse(
    localStorage.getItem("supabase_team_list") || "[]",
  );

  const championTeams = supabase_team_list.filter((team) =>
    team.champion_ids.includes(String(champion.id)),
  );
  const championTeamCount = championTeams.length;
  const championTeamNames = championTeams.map((t) => t.team_name);

  const isBuilt = checkIfChampionIsBuilt(champion);
  const thresholdDifferenceTolerance: number = 2;
  let thresholdDifference = 0;

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return;

  const groupedSkills = !champion.skills
    ? []
    : champion.skills.reduce<Record<number, Skill[]>>((acc, skill) => {
        if (!acc[skill.skill_index]) acc[skill.skill_index] = [];
        acc[skill.skill_index].push(skill);
        return acc;
      }, {});

  const stats = [
    {
      label: "HP",
      key: "hp",
      threshold: champion.type === ChampionType.HP ? 45000 : 30000,
    },
    {
      label: "ATK",
      key: "atk",
      threshold:
        champion.type === ChampionType.ATTACK &&
        champion.role?.includes(ChampionRole.NUKER)
          ? 4000
          : 0,
    },
    {
      label: "DEF",
      key: "def",
      threshold: champion.type === ChampionType.DEFENSE ? 4000 : 2500,
    },
    {
      label: "SPD",
      key: "spd",
      threshold: champion.role?.includes(ChampionRole.DEBUFFER) ? 180 : 160,
    },
    {
      label: "C.Rate",
      key: "c_rate",
      threshold: champion.role?.includes(ChampionRole.NUKER) ? 100 : 0,
    },
    {
      label: "C.DMG",
      key: "c_dmg",
      threshold:
        champion.role?.includes(ChampionRole.NUKER) ||
        champion.role?.includes(ChampionRole.MAX_HP_DPS)
          ? 200
          : 0,
    },
    { label: "RES", key: "res", threshold: 0 },
    {
      label: "ACC",
      key: "acc",
      threshold:
        champion.role?.includes(ChampionRole.DEBUFFER) ||
        champion.role?.includes(ChampionRole.TM_REDUCER)
          ? 200
          : 0,
    },
  ] as const;

  const checkBuildThreshold = (available: number, threshold: number) => {
    if (available >= threshold) return "text-green-500";
    thresholdDifference++;
    return "text-red-500";
  };

  const handleDeleteClick = () => setDeleteModalOpen(true);

  const handleOnClose = () => {
    setDeleteModalOpen(false);
    if (onDelete) onDelete();
  };

  const handleDelete = async () => {
    if (champion.id) {
      await deleteChampion(champion.id.toString())
        .then((deleted) => {
          const supabase_champions = JSON.parse(
            localStorage.getItem("supabase_champion_list") || "[]",
          );
          const updatedChampions = supabase_champions.filter(
            (c: IChampion) => c.id !== deleted.id,
          );
          localStorage.setItem(
            "supabase_champion_list",
            JSON.stringify(updatedChampions),
          );
        })
        .catch((error) => console.error("Error deleting champion:", error));
    } else console.error("Champion ID does not exist!");
    handleOnClose();
  };

  const statusBg = isBuilt
    ? thresholdDifference >= thresholdDifferenceTolerance
      ? "bg-amber-400"
      : "bg-green-500"
    : champion.spd <= 120
      ? "bg-gray-900"
      : "bg-red-500";

  const statusLabel = isBuilt
    ? thresholdDifference >= thresholdDifferenceTolerance
      ? "Needs Improvement"
      : "Built ✓"
    : champion.spd <= 120
      ? "Untouched"
      : "Not Built";

  return (
    <>
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 flex flex-col bg-white">

        {/* ── HEADER ── */}
        <div className={`flex items-center justify-between px-3 py-2 ${colorByRarity(champion.rarity)}`}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={champion.affinity} alt="" className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm truncate">{champion.name}</p>
          </div>
          {champion.level === 60 && champion.stars === 6 ? (
            <div className="relative h-7 w-7 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full fire-border" />
              <div className="relative z-10 h-7 w-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                {champion.level}
              </div>
            </div>
          ) : (
            <div className="h-7 w-7 shrink-0 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold ring-1 ring-slate-500">
              {champion.level}
            </div>
          )}
        </div>

        {/* ── IMAGE ── */}
        <div className="relative w-full h-56 overflow-hidden">
          {/* Stars – top-right */}
          <div className="absolute top-0 right-0 z-20 bg-black/50 backdrop-blur-sm rounded-bl-xl px-2 py-1">
            <ChampionStar
              stars={champion.stars}
              ascension_stars={champion.ascension_stars}
              awaken_stars={champion.awaken_stars}
            />
          </div>

          {/* PP / Impact – bottom-left, overlaid on image */}
          {(champion.priority || champion.champion_impact) && (
            <div className="absolute bottom-2 left-2 z-20 flex gap-1">
              {champion.priority && (
                <div
                  className="flex items-center overflow-hidden rounded-full shadow-lg border border-pink-400 text-xs"
                  title="Priority Point"
                >
                  <span className="px-2 py-0.5 bg-pink-500 text-white font-semibold">PP</span>
                  <span className="px-2 py-0.5 bg-white/95 text-pink-600 font-semibold">
                    {champion.priority.toFixed(1)}%
                  </span>
                </div>
              )}
              {champion.champion_impact && !champion.priority && (
                <div
                  className="flex items-center overflow-hidden rounded-full shadow-lg border border-orange-400 text-xs"
                  title="Impact on game"
                >
                  <span className="px-2 py-0.5 bg-orange-500 text-white font-semibold">Impact</span>
                  <span className="px-2 py-0.5 bg-white/95 text-orange-600 font-semibold">
                    {champion.champion_impact.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Blurred background */}
          <div
            className={`absolute inset-0 bg-center bg-cover blur-md scale-110 ${nsfw ? "invisible" : "visible"}`}
            style={{ backgroundImage: `url(${champion.imgUrl})` }}
          />
          {/* Foreground image */}
          <a
            href={champion.championUrl}
            target="_blank"
            className="relative z-10 flex justify-center h-full"
          >
            <img
              src={champion.imgUrl}
              alt={champion.name}
              className={`object-contain h-full hover:scale-105 transition duration-300 ${nsfw ? "invisible" : "visible"}`}
            />
          </a>
        </div>

        {/* ── IDENTITY STRIP: Faction · Rarity dot · Type · Roles ── */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100"
          hidden={showAllSkills}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={getFactionLogo(champion.faction)}
              className="w-5 h-5 object-cover rounded-full shrink-0"
            />
            <span className="text-xs text-gray-600 truncate">{champion.faction}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorByRarity(champion.rarity)}`}
              title={champion.rarity}
            />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 capitalize font-medium">
              {champion.type}
            </span>
            {champion.role
              .filter((r) => ChampionRoleImageMap[r])
              .map((role) => (
                <div key={role} className="w-5 h-5 shrink-0" title={role}>
                  <img
                    src={ChampionRoleImageMap[role]}
                    alt={role}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 px-3 py-2 space-y-2">

          {/* Skills */}
          {showSkills && (
            <>
              <div className={`overflow-auto pr-1 ${showAllSkills ? "h-60" : "h-20"}`}>
                {Object.keys(groupedSkills).length > 0 ? (
                  <table className="w-full">
                    <tbody className="text-sm">
                      {Object.entries(groupedSkills).map(([skillIndex, skillGroup]) =>
                        skillGroup.map((skill, skillRowIndex) => (
                          <tr key={`${skillIndex}-${skillRowIndex}`}>
                            {skillRowIndex === 0 && (
                              <td
                                rowSpan={skillGroup.length}
                                className="align-top font-semibold text-nowrap pr-2"
                              >
                                Skill {skillIndex}
                              </td>
                            )}
                            <td className="pb-2 text-right">
                              <div className="flex justify-end items-center flex-wrap gap-1">
                                {skill.effects.map((effect, effectIndex) => (
                                  <div
                                    key={effectIndex}
                                    className="flex items-center gap-0.5 border rounded-md overflow-hidden shadow-sm"
                                    title={effect.name}
                                  >
                                    {effect.cool_down !== undefined && (
                                      <span className="flex items-center bg-slate-800 text-white px-1.5 py-0.5 text-[10px] gap-0.5">
                                        {effect.cool_down}<LuRefreshCw size={10} />
                                      </span>
                                    )}
                                    {effect.duration !== undefined && (
                                      <span className="flex items-center bg-slate-800 text-white px-1.5 py-0.5 text-[10px] gap-0.5">
                                        {effect.duration}<FaRegHourglass size={9} />
                                      </span>
                                    )}
                                    {effect.land_chance !== undefined && (
                                      <span className="flex items-center px-1.5 py-0.5 text-[10px] gap-0.5">
                                        {effect.land_chance}%<BsDice6Fill size={10} />
                                      </span>
                                    )}
                                    {effect.target !== undefined && (
                                      <span className="px-1 text-[11px]">
                                        {effect.target === "All"
                                          ? "🌐"
                                          : effect.target === "Single"
                                            ? "🎯"
                                            : "🎯🎯"}
                                      </span>
                                    )}
                                    <img
                                      src={`/img/${effect.type}s/${effect.name}.png`}
                                      className={`w-5 h-5 object-contain ${effect.type === "buff" ? "bg-blue-500" : "bg-red-500"}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No Skills Data...
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`text-xs px-3 py-0.5 border rounded-full ml-auto block hover:bg-gray-100 transition cursor-pointer ${Object.keys(groupedSkills).length === 0 ? "invisible" : ""}`}
                onClick={() => setShowAllSkills(!showAllSkills)}
              >
                {showAllSkills ? "Show Less ▲" : "Show More ▼"}
              </button>

              {/* Aura */}
              <div
                className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50"
                hidden={showAllSkills}
                title={champion?.aura?.effect ?? "N/A"}
              >
                {champion?.aura?.effect ? (
                  <img
                    src={`/img/auras/${champion.aura.effect}.webp`}
                    className="w-6 h-6 object-contain shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                    X
                  </div>
                )}
                <div className="text-xs min-w-0">
                  <p className="font-semibold truncate">
                    {champion?.aura?.effect || "No Aura"}
                  </p>
                  <p className="text-gray-400 truncate">
                    {champion?.aura?.active_in ?? "N/A"} · {champion?.aura?.effectiveness ?? "N/A"}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── STATS with progress bars ── */}
          <div className="space-y-1.5" hidden={showAllSkills}>
            {stats.map(({ label, key, threshold }) => {
              const value = champion[key];
              const colorClass = checkBuildThreshold(value, threshold);
              const hasBar = threshold > 0;
              const pct = hasBar ? Math.min((value / threshold) * 100, 100) : 0;
              const met = value >= threshold;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10 shrink-0">{label}</span>
                  {hasBar ? (
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${met ? "bg-green-400" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div className={`text-xs font-semibold text-right w-20 shrink-0 ${colorClass}`}>
                    {!met && threshold > 0 && (
                      <span className="text-[10px] opacity-40 mr-0.5">
                        -{threshold - value}
                      </span>
                    )}
                    {formatNumber(value)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── BOOK · MASTERY · TEAMS ── */}
          <div className="flex items-center gap-2 flex-wrap pt-1" hidden={showAllSkills}>
            <span
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium
                ${champion.is_booked
                  ? "bg-green-50 border-green-300 text-green-600"
                  : "bg-red-50 border-red-200 text-red-400"}`}
            >
              {champion.is_booked ? <FaCheckCircle size={10} /> : <MdCancel size={10} />}
              Book
            </span>
            <span
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium
                ${champion.has_mastery
                  ? "bg-green-50 border-green-300 text-green-600"
                  : "bg-red-50 border-red-200 text-red-400"}`}
            >
              {champion.has_mastery ? <FaCheckCircle size={10} /> : <MdCancel size={10} />}
              Mastery
            </span>

            {/* Team count + tooltip */}
            <div className="relative group flex items-center gap-1 ml-auto text-xs text-gray-400 cursor-default">
              <FaInfoCircle
                size={11}
                className={championTeamCount > 0 ? "text-blue-400" : "text-gray-300"}
              />
              <span>{championTeamCount} team{championTeamCount !== 1 ? "s" : ""}</span>
              {championTeamCount > 0 && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg shadow-xl px-3 py-2 z-50 min-w-max">
                  <ul className="space-y-1">
                    {championTeamNames.map((t) => (
                      <li key={t} className="whitespace-nowrap">• {fromSlug(t)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── EDIT / DELETE ── */}
        {onEdit && onDelete && (
          <div className="flex gap-2 px-3 pb-3">
            <button
              type="button"
              onClick={() => onEdit(champion)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-500 border border-blue-400 rounded-full py-1.5 hover:bg-blue-500 hover:text-white transition cursor-pointer"
            >
              <FaEdit size={12} /> Edit
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-500 border border-red-400 rounded-full py-1.5 hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              <FaTrash size={11} /> Delete
            </button>
          </div>
        )}

        {/* ── BUILD STATUS FOOTER ── */}
        <div className={`text-center py-2 text-white text-xs font-bold tracking-widest uppercase ${statusBg}`}>
          {statusLabel}
        </div>
      </div>

      {deleteModalOpen && (
        <Modal
          isOpen={deleteModalOpen}
          title={`Do you want to delete ${champion.name}?`}
          onClose={handleOnClose}
        >
          <hr className="my-4" />
          <div className="flex justify-end gap-2 mt-2 [&>button]:cursor-pointer">
            <button
              type="button"
              onClick={handleOnClose}
              className="border border-gray-500 hover:bg-gray-600 transition text-gray-500 hover:text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
