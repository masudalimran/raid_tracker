import type IChampion from "../../models/IChampion.ts";
import ChampionStar from "../utility/ChampionStar.tsx";
import { formatNumber } from "../../helpers/formatNumber.ts";
import { FaCheckCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { ChampionRole } from "../../models/ChampionRole.ts";
import { ChampionRarity } from "../../models/ChampionRarity.ts";

interface ChampionCardProps {
  champion: IChampion;
}

const basic_info = [
  { label: "Faction", key: "faction" },
  { label: "Rarity", key: "rarity" },
  { label: "Type", key: "type" },
] as const;

const stats = [
  { label: "HP", key: "hp", threshold: 0 },
  { label: "ATK", key: "atk", threshold: 0 },
  { label: "DEF", key: "def", threshold: 0 },
  { label: "SPD", key: "spd", threshold: 0 },
  { label: "C.Rate", key: "c_rate", threshold: 0 },
  { label: "C.DMG", key: "c_dmg", threshold: 0 },
  { label: "RES", key: "res", threshold: 0 },
  { label: "ACC", key: "acc", threshold: 0 },
] as const;

export default function ChampionCard({ champion }: ChampionCardProps) {
  const checkIfBuilt: () => boolean = (): boolean => {
    if (champion.role.includes(ChampionRole.NUKER) && champion.level < 60)
      return false;
    if (champion.level < 50) return false;
    if (!champion.is_booked) return false;
    if (!champion.has_mastery) return false;
    return true;
  };

  const determineCardBg = (): string => {
    switch (champion.rarity) {
      case ChampionRarity.MYTHICAL:
        return "bg-red-100";
        break;
      case ChampionRarity.LEGENDARY:
        return "bg-orange-100";
        break;
      case ChampionRarity.EPIC:
        return "bg-purple-100";
        break;
      case ChampionRarity.RARE:
        return "bg-blue-100";
        break;
      case ChampionRarity.UNCOMMON:
        return "bg-green-100";
        break;
      case ChampionRarity.COMMON:
        return "bg-gray-100";
        break;
      default:
        return "bg-gray-100";
        break;
    }
  };

  return (
    <div
      className={`border border-gray-300 rounded-xl overflow-hidden shadow-xl`}
    >
      <div className="flex-between basic-padding">
        <div className="flex-left">
          <div>
            <img
              src={champion.affinity}
              alt={champion.name}
              height="20px"
              width="20px"
            />
          </div>
          <p>
            <b>{champion.name}</b> Lvl. {champion.level}
          </p>
        </div>
        <ChampionStar
          stars={champion.stars}
          ascension_stars={champion.ascension_stars}
          awaken_stars={champion.awaken_stars}
        />
      </div>

      <div className={`${determineCardBg()} min-w-75 overflow-hidden`}>
        <a href={champion.championUrl} target="_blank">
          <img
            src={champion.imgUrl}
            alt={champion.name}
            className="object-contain w-full h-50 hover:scale-105 transition duration-600"
          />
        </a>
      </div>

      <div className="basic-padding">
        <table className="w-full">
          <tbody>
            {basic_info.map(({ label, key }) => (
              <tr key={key}>
                <td>{label}</td>
                <td className="text-right">{champion[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="my-2"></hr>

        <table className="w-full">
          <tbody>
            {stats.map(({ label, key }) => (
              <tr key={key}>
                <td>{label}</td>
                <td className="text-right">{formatNumber(champion[key])}</td>
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

        <div>
          <p
            className={`text-center w-full basic-padding text-white ${
              checkIfBuilt() ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {checkIfBuilt() ? "" : "Not "} Built
          </p>
        </div>
      </div>
    </div>
  );
}
