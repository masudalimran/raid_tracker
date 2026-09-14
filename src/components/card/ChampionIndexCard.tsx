import { useState } from "react";
import { getAffinityImagePath } from "../../helpers/getAffinityImagePath";
import getFactionLogo from "../../helpers/getFactionLogo";
import type { ChampionFaction } from "../../models/ChampionFaction";
import Tooltip from "../utility/Tooltip";

interface ChampionIndexCardProps {
  name: string;
  affinity: string;
  role: string;
  faction: ChampionFaction;
  owned: boolean;
  imgUrl?: string;
  support?: number;
  dpsPotential?: number;
  tankiness?: number;
}

const SCORE_BARS = [
  { key: "support" as const, label: "SUP", color: "bg-emerald-400" },
  { key: "dpsPotential" as const, label: "DPS", color: "bg-red-400" },
  { key: "tankiness" as const, label: "TNK", color: "bg-blue-400" },
];

export default function ChampionIndexCard({
  name,
  affinity,
  role,
  faction,
  owned,
  imgUrl,
  support,
  dpsPotential,
  tankiness,
}: ChampionIndexCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const scores = { support, dpsPotential, tankiness };
  const hasScore = support !== undefined && dpsPotential !== undefined && tankiness !== undefined;
  const showRealImage = owned && imgUrl && !imgFailed;

  return (
    <div
      className={`rounded-lg overflow-hidden bg-white dark:bg-gray-900 border transition
        ${owned
          ? "border-gray-200 dark:border-gray-800"
          : "border-dashed border-gray-300 dark:border-gray-700 opacity-60"}`}
    >
      {/* Image slot — identical box for both branches so text below always
          starts at the same height regardless of whether we own this champion. */}
      <Tooltip content={showRealImage ? undefined : "Not in your roster yet"} className="block w-full">
        <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800">
          <img
            src={showRealImage ? imgUrl : getFactionLogo(faction)}
            alt={showRealImage ? name : ""}
            onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover ${showRealImage ? "" : "grayscale opacity-40"}`}
          />
          <img
            src={getAffinityImagePath(affinity)}
            alt={affinity}
            title={affinity}
            className="absolute top-1 left-1 w-4 h-4 drop-shadow"
          />
        </div>
      </Tooltip>

      <div className="px-1.5 py-1 space-y-1">
        <div>
          <p className="text-[10px] font-semibold truncate" title={name}>{name}</p>
          <p className="text-[9px] text-gray-400">{role}</p>
        </div>

        {hasScore ? (
          <div className="space-y-0.5">
            {SCORE_BARS.map(({ key, label, color }) => (
              <Tooltip key={key} content={`${label} ${scores[key]}/100`} className="block w-full">
                <div className="flex items-center gap-1">
                  <span className="text-[6px] font-bold text-gray-400 w-5 shrink-0">{label}</span>
                  <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${scores[key]}%` }} />
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        ) : (
          <p className="text-[8px] text-gray-300 dark:text-gray-600 italic">No score yet</p>
        )}
      </div>
    </div>
  );
}
