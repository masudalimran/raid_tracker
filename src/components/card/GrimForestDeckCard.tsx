import { useState } from "react";
import { checkIfChampionIsBuilt } from "../../helpers/checkIfChampionIsBuilt";
import { ChampionRoleImageMap } from "../../models/ChampionRole";
import { getChampionRoleMatches, type AreaRoleReq } from "../../data/areaRoleRequirements";
import type IChampion from "../../models/IChampion";
import Tooltip from "../utility/Tooltip";

interface GrimForestDeckCardProps {
  champion: IChampion;
  /** The deck's required roles — any the champion covers get a small icon on the card. */
  requiredRoles: AreaRoleReq[];
  onClick: () => void;
}

/** Minimal champion card for the Grim Forest decks — portrait + name, with small icons for any required role it covers. Click opens the full preview popup, same as elsewhere in the app. */
export default function GrimForestDeckCard({ champion, requiredRoles, onClick }: GrimForestDeckCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const matchedLabels = getChampionRoleMatches(champion, requiredRoles);
  const matchedReqs = requiredRoles.filter((req) => matchedLabels.includes(req.label));
  const isBuilt = checkIfChampionIsBuilt(champion);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-amber-400 hover:shadow-sm transition cursor-pointer p-1.5"
    >
      <div className={`relative w-full aspect-square rounded-md overflow-hidden border-2 ${isBuilt ? "border-green-500" : "border-red-400"}`}>
        {champion.imgUrl && !imgFailed ? (
          <img
            src={champion.imgUrl}
            alt={champion.name}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 font-bold">
            {champion.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <p className="text-[10px] font-semibold truncate w-full text-center" title={champion.name}>
        {champion.name}
      </p>
      {matchedReqs.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-0.5">
          {matchedReqs.map((req) => (
            <Tooltip key={req.label} content={req.label}>
              <img
                src={ChampionRoleImageMap[req.matchRoles![0]]}
                alt={req.label}
                className="w-3.5 h-3.5 rounded-full object-contain"
              />
            </Tooltip>
          ))}
        </div>
      )}
    </button>
  );
}
