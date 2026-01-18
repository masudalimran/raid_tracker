import type IChampion from "../../models/IChampion.ts";
import ChampionStar from "../utility/ChampionStar.tsx";
import { formatNumber } from "../../helpers/formatNumber.ts";
import { FaCheckCircle, FaEdit, FaInfoCircle, FaTrash } from "react-icons/fa";
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

interface ChampionCardProps {
  champion: IChampion;
  onEdit?: (champion: IChampion) => void;
  onDelete?: () => void;
  nsfw?: boolean;
}

export default function ChampionCard({
  champion,
  onEdit,
  onDelete,
  nsfw = false,
}: ChampionCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const { deleteChampion, loading } = useChampion();

  // Parse teams from localStorage
  const supabase_team_list: ITeam[] = JSON.parse(
    localStorage.getItem("supabase_team_list") || "[]"
  );

  const championTeams = supabase_team_list.filter((team) =>
    team.champion_ids.includes(String(champion.id))
  );

  const championTeamCount = championTeams.length;
  const championTeamNames = championTeams.map((t) => t.team_name);

  const isBuilt = checkIfChampionIsBuilt(champion);
  const thresholdDifferenceTolerance: number = 2;
  let thresholdDifference = 0;

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]"
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return;

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
      threshold: champion.role?.includes(ChampionRole.NUKER) ? 200 : 0,
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
    if (available > threshold) {
      return "text-green-500";
    } else {
      thresholdDifference++;
      return "text-red-500";
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleOnClose = () => {
    setDeleteModalOpen(false);
    if (onDelete) onDelete();
  };

  const handleDelete = async () => {
    if (champion.id) {
      await deleteChampion(champion.id.toString())
        .then((deleted) => {
          const supabase_champions = JSON.parse(
            localStorage.getItem("supabase_champion_list") || "[]"
          );
          const updatedChampions = supabase_champions.filter(
            (c: IChampion) => c.id !== deleted.id
          );
          localStorage.setItem(
            "supabase_champion_list",
            JSON.stringify(updatedChampions)
          );
        })
        .catch((error) => {
          console.error("Error deleting champion:", error);
        });
    } else console.error("Champion ID does not exist!");

    handleOnClose();
  };

  return (
    <>
      <div
        className={`border border-gray-300 rounded-xl overflow-hidden shadow-xl`}
      >
        <div
          className={`flex-between basic-padding ${colorByRarity(
            champion.rarity
          )}`}
        >
          <div className="flex-left">
            <div>
              <img
                src={champion.affinity}
                alt={champion.name}
                height="20px"
                width="20px"
              />
            </div>
            <p className="truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch]">
              {champion.name}
            </p>
            <div className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold ring-1 ring-slate-500">
              {champion.level}
            </div>
          </div>
          <ChampionStar
            stars={champion.stars}
            ascension_stars={champion.ascension_stars}
            awaken_stars={champion.awaken_stars}
          />
        </div>

        <div
          className={`relative w-full h-50 overflow-hidden ${
            nsfw ? "invisible" : "visible"
          }`}
        >
          {/* Blurred background */}
          <div
            className="absolute inset-0 bg-center bg-cover blur-md scale-110"
            style={{ backgroundImage: `url(${champion.imgUrl})` }}
          />

          {/* Foreground image */}
          <a
            href={champion.championUrl}
            target="_blank"
            className="relative z-10 flex justify-center"
          >
            <img
              src={champion.imgUrl}
              alt={champion.name}
              className="object-contain h-50 hover:scale-105 transition duration-300"
            />
          </a>
        </div>

        {onEdit && onDelete && (
          <div className="flex-between basic-padding">
            <div>
              {champion.priority && (
                <div
                  className="text-xs border border-pink-400 rounded-r flex items-center gap-0"
                  title="Priority Point"
                >
                  <p className="basic-padding-xs bg-pink-400 text-white">PP</p>
                  <p className="basic-padding-xs">
                    {Math.round(champion.priority * 100)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex-right ">
              <div
                className="basic-padding-xs text-xs flex-center border rounded-full text-blue-500 cursor-pointer hover:bg-blue-500 transition border-blue-500 hover:text-white"
                onClick={() => onEdit(champion)}
              >
                <p>Edit</p>
                <FaEdit size={16} className="" />
              </div>
              <div
                onClick={handleDeleteClick}
                className="basic-padding-xs text-xs flex-center border rounded-full text-red-500 cursor-pointer hover:bg-red-500 transition border-red-500 hover:text-white"
              >
                <p>Delete</p>
                <FaTrash size={15} className="" />
              </div>
            </div>
          </div>
        )}

        <hr className="mb-2"></hr>

        <div className="basic-padding">
          <table className="w-full">
            <tbody>
              <tr>
                <td>Faction</td>
                <td className="text-right capitalize truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch]">
                  <div className="flex justify-end items-center gap-1">
                    <img
                      src={getFactionLogo(champion.faction)}
                      className="w-5 h-5 object-cover rounded-full"
                    />
                    <p>{champion.faction}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Rarity</td>
                <td
                  className={`text-right capitalize truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch] `}
                >
                  <div className="flex justify-end items-center gap-1">
                    <div
                      className={`h-5 w-5 rounded-full ${colorByRarity(
                        champion.rarity
                      )}`}
                    />{" "}
                    <p>{champion.rarity}</p>
                  </div>
                </td>
              </tr>

              <tr>
                <td>Type</td>
                <td className="text-right capitalize truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch]">
                  {champion.type}
                </td>
              </tr>

              <tr>
                <td>
                  <div className="flex justify-start items-center gap-2 w-full">
                    Role
                    <div className="flex-1 w-full h-full border-gray-500 border"></div>
                  </div>
                </td>
                <td>
                  <div className="flex-1 w-full h-full border-gray-500 border"></div>
                </td>
              </tr>

              <tr>
                <td>Primary</td>
                <td className="text-right capitalize truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch]">
                  <div className="flex justify-end item-center">
                    <div className="flex gap-1">
                      {champion.role
                        .filter((role) => ChampionRoleImageMap[role])
                        .map((role) => (
                          <div
                            key={role}
                            className="w-5 h-5 flex-center text-xs rounded-full"
                            title={role}
                          >
                            <img
                              src={ChampionRoleImageMap[role]}
                              alt={role}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Secondary</td>
                <td className="text-right capitalize truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[18ch] lg:max-w-[20ch]">
                  {champion.role.filter((role) => !ChampionRoleImageMap[role])
                    .length
                    ? champion.role
                        .filter((role) => !ChampionRoleImageMap[role])
                        .join(", ")
                    : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          <hr className="my-2"></hr>

          <table className="w-full">
            <tbody>
              {stats.map(({ label, key, threshold }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td
                    className={`text-right ${checkBuildThreshold(
                      champion[key],
                      threshold
                    )}`}
                  >
                    {champion[key] < threshold && (
                      <span className="opacity-50 mr-1">
                        (-{threshold - champion[key]})
                      </span>
                    )}
                    {formatNumber(champion[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="my-2"></hr>

          <div className="flex-between">
            <div className="flex-center">
              <p>Book: </p>
              {champion.is_booked ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <MdCancel className="text-red-500" />
              )}
            </div>
            <div className="flex-center">
              <p>Mastery: </p>
              {champion.has_mastery ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <MdCancel className="text-red-500" />
              )}
            </div>
          </div>

          <hr className="my-2"></hr>

          <div className="flex-left gap-1 mt-2 relative group">
            <p className="text-sm">
              Used in {championTeamCount} team
              {championTeamCount !== 1 ? "s" : ""}
            </p>

            {championTeamCount > 0 && (
              <>
                {/* Info icon */}
                <FaInfoCircle />

                {/* Tooltip */}
                <div
                  className="
          absolute bottom-full  mb-2
          hidden group-hover:block
          bg-gray-800 text-white text-xs
          rounded-md shadow-lg
          px-3 py-2
          max-w-xs
          z-50
        "
                >
                  <ul className="space-y-1">
                    {championTeamNames.map((team) => (
                      <li key={team} className="whitespace-nowrap">
                        • {fromSlug(team)}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <p
            className={`text-center w-full basic-padding text-white ${
              isBuilt
                ? thresholdDifference >= thresholdDifferenceTolerance
                  ? "bg-yellow-400"
                  : "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {isBuilt
              ? thresholdDifference >= thresholdDifferenceTolerance
                ? "Needs Improvement"
                : "Built"
              : "Not Built"}
          </p>
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
