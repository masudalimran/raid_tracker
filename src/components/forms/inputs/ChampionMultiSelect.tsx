import { Fragment, useMemo, useRef, useState } from "react";
import type IChampion from "../../../models/IChampion";
import colorByRarity from "../../../helpers/colorByRarity";
import { HiOutlineExternalLink } from "react-icons/hi";
import { FaEdit } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import Tooltip from "../../utility/Tooltip";
import ChampionModal from "../../modals/ChampionModal";
import Modal from "../../modals/Modal";
import ChampionCard from "../../card/ChampionCard";
import { checkIfChampionIsBuilt } from "../../../helpers/checkIfChampionIsBuilt";
import { ChampionRarity } from "../../../models/ChampionRarity";
import { ChampionRole } from "../../../models/ChampionRole";
import {
  checkTeamCoverage,
  getChampionRoleMatches,
  type AreaRoleReq,
} from "../../../data/areaRoleRequirements";
import { suggestTeam } from "../../../helpers/suggestTeam";

interface ChampionMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  champions: IChampion[];
  max?: number;
  requiredRoles?: AreaRoleReq[];
}

const LONG_PRESS_MS = 500;

/** Distinguishes a quick tap (preview) from a held press (edit) on the same button. */
function useLongPress(onLongPress: () => void, onClick: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    triggeredRef.current = false;
    clear();
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const end = () => {
    clear();
    if (!triggeredRef.current) onClick();
  };

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

const RARITY_ORDER: Record<string, number> = {
  [ChampionRarity.MYTHICAL]: 0,
  [ChampionRarity.LEGENDARY]: 1,
  [ChampionRarity.EPIC]: 2,
  [ChampionRarity.RARE]: 3,
  [ChampionRarity.UNCOMMON]: 4,
  [ChampionRarity.COMMON]: 5,
};

function NotViableBadge() {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5 shrink-0">
      Not Viable
    </span>
  );
}

const byRarityThenName = (a: IChampion, b: IChampion) => {
  const rarityDiff =
    (RARITY_ORDER[a.rarity] ?? Object.keys(RARITY_ORDER).length) -
    (RARITY_ORDER[b.rarity] ?? Object.keys(RARITY_ORDER).length);
  if (rarityDiff !== 0) return rarityDiff;
  return a.name.localeCompare(b.name);
};

export default function ChampionMultiSelect({
  value,
  onChange,
  champions,
  max = 6,
  requiredRoles = [],
}: ChampionMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "suggested">("all");
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);
  const [previewChampion, setPreviewChampion] = useState<IChampion | null>(null);
  // Live-edited champions, keyed by id — applied on top of the `champions`
  // prop so an edit shows up immediately without needing the parent team
  // form/modal to re-fetch and re-render with a fresh champions array.
  const [overrides, setOverrides] = useState<Record<string, IChampion>>({});

  const effectiveChampions = useMemo(
    () => champions.map((c) => overrides[c.id?.toString() ?? ""] ?? c),
    [champions, overrides],
  );

  const handleEditClose = (shouldReload: boolean) => {
    if (shouldReload && editingChampion?.id) {
      const stored = JSON.parse(
        localStorage.getItem("supabase_champion_list") ?? "[]",
      ) as IChampion[];
      const updated = stored.find((c) => String(c.id) === String(editingChampion.id));
      if (updated) {
        setOverrides((prev) => ({ ...prev, [String(editingChampion.id)]: updated }));
      }
    }
    setEditingChampion(null);
  };

  const toggleChampion = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  };

  const filtered = useMemo(() => {
    return effectiveChampions.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [effectiveChampions, query]);

  const selectedChampions = useMemo(() => {
    return effectiveChampions
      .filter((c) => value.includes(c.id?.toString() ?? ""))
      .slice()
      .sort(byRarityThenName);
  }, [effectiveChampions, value]);

  const unselectedChampions = useMemo(() => {
    return filtered
      .filter((c) => !value.includes(c.id?.toString() ?? ""))
      .slice()
      .sort(byRarityThenName);
  }, [filtered, value]);

  const suggestedTeam = useMemo(() => {
    if (requiredRoles.length === 0) return [];
    return suggestTeam(effectiveChampions, requiredRoles, max);
  }, [effectiveChampions, requiredRoles, max]);

  const suggestedCoverageCount = useMemo(() => {
    if (requiredRoles.length === 0) return 0;
    return checkTeamCoverage(
      requiredRoles,
      suggestedTeam.map((s) => s.champion),
    ).filter((c) => c.coveredBy.length > 0).length;
  }, [requiredRoles, suggestedTeam]);

  const selectSuggestedTeam = () => {
    onChange(suggestedTeam.map((s) => s.champion.id!.toString()));
  };

  const ChampionRow = ({ champ }: { champ: IChampion }) => {
    const pressHandlers = useLongPress(
      () => setEditingChampion(champ),
      () => setPreviewChampion(champ),
    );

    if (!champ.id) return null;

    const id = champ.id.toString();
    const checked = value.includes(id);
    const matchedLabels = getChampionRoleMatches(champ, requiredRoles);

    return (
      <div className="flex items-center gap-1 w-full pr-4">
        <label
          className={`flex-1 flex items-center gap-2 cursor-pointer basic-padding-xs text-gray-900 ${colorByRarity(
            champ.rarity,
          )}`}
        >
          <div className="flex-1 flex justify-start items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleChampion(id)}
            />
            <div>
              <img
                src={champ.imgUrl}
                className={`h-7 w-7 object-cover rounded-full border-2 ${
                  checkIfChampionIsBuilt(champ)
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              />
            </div>
            <span className="truncate">{champ.name}</span>
            {champ.role?.includes(ChampionRole.NOT_VIABLE) && <NotViableBadge />}
          </div>

          {requiredRoles.length > 0 && (
            <span
              className={`text-[10px] truncate max-w-28 sm:max-w-48 ${
                matchedLabels.length > 0 ? "text-green-600 font-medium" : "text-gray-400"
              }`}
            >
              {matchedLabels.length > 0 ? `Covers: ${matchedLabels.join(", ")}` : "No required role"}
            </span>
          )}
        </label>

        <Tooltip content="Tap to preview · Hold to edit">
          <button
            type="button"
            {...pressHandlers}
            className={`${colorByRarity(
              champ.rarity,
            )} h-9 w-9 flex-center hover:opacity-75 transition cursor-pointer`}
          >
            <FaEdit />
          </button>
        </Tooltip>

        <a
          href={champ.championUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${colorByRarity(
            champ.rarity,
          )} h-9 w-9 flex-center hover:opacity-75 transition`}
        >
          <HiOutlineExternalLink />
        </a>
      </div>
    );
  };

  const SuggestedTeamRow = ({
    champ,
    matchedLabels,
    alreadySelected,
  }: {
    champ: IChampion;
    matchedLabels: string[];
    alreadySelected: boolean;
  }) => {
    const pressHandlers = useLongPress(
      () => setEditingChampion(champ),
      () => setPreviewChampion(champ),
    );

    if (!champ.id) return null;

    return (
      <div
        className={`flex items-center gap-2 w-full pr-2 rounded basic-padding-xs text-gray-900 ${colorByRarity(
          champ.rarity,
        )} ${alreadySelected ? "ring-2 ring-emerald-400" : ""}`}
      >
        <img
          src={champ.imgUrl}
          className={`h-7 w-7 object-cover rounded-full border-2 shrink-0 ${
            checkIfChampionIsBuilt(champ) ? "border-green-500" : "border-red-500"
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{champ.name}</p>
            {champ.role?.includes(ChampionRole.NOT_VIABLE) && <NotViableBadge />}
          </div>
          {matchedLabels.length > 0 && (
            <p className="text-[10px] text-gray-600 truncate">
              Covers: {matchedLabels.join(", ")}
            </p>
          )}
        </div>
        {alreadySelected && (
          <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
            Already in team
          </span>
        )}
        <Tooltip content="Tap to preview · Hold to edit">
          <button
            type="button"
            {...pressHandlers}
            className="h-7 w-7 flex-center shrink-0 text-gray-500 hover:text-gray-800 hover:opacity-75 transition cursor-pointer"
          >
            <FaEdit size={14} />
          </button>
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="border rounded p-2">
      {requiredRoles.length > 0 && (
        <div className="flex gap-1 mb-2">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`flex-1 text-xs font-semibold py-1 rounded cursor-pointer transition ${
              viewMode === "all"
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Champions
          </button>
          <button
            type="button"
            onClick={() => setViewMode("suggested")}
            className={`flex-1 text-xs font-semibold py-1 rounded cursor-pointer transition ${
              viewMode === "suggested"
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Suggested Team
          </button>
        </div>
      )}

      {viewMode === "suggested" && requiredRoles.length > 0 ? (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Covers {suggestedCoverageCount}/{requiredRoles.length} required
            roles
          </p>

          {suggestedTeam.length > 0 ? (
            <div className="space-y-1 mb-2">
              {suggestedTeam.map(({ champion, matchedLabels }) => (
                <Fragment key={champion.id}>
                  <SuggestedTeamRow
                    champ={champion}
                    matchedLabels={matchedLabels}
                    alreadySelected={value.includes(
                      champion.id?.toString() ?? "",
                    )}
                  />
                </Fragment>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-2">
              Not enough champions available to suggest a team.
            </p>
          )}

          <button
            type="button"
            disabled={suggestedTeam.length === 0}
            onClick={selectSuggestedTeam}
            className="btn-primary w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Select Suggested Team
          </button>
        </div>
      ) : (
        <>
          {/* Selected Champions */}
          {selectedChampions.length > 0 && (
            <div className="mb-3 border-b pb-2">
              <p className="text-xs font-semibold mb-1">
                Selected Champions ({value.length}/{max})
              </p>
              <div className="space-y-1">
                {selectedChampions.map((champ) => (
                  <Fragment key={champ.id}>
                    <ChampionRow champ={champ} />
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search champions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border px-2 py-1 pr-7 rounded"
            />
            {query && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <Tooltip content="Clear search">
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <MdClose size={14} />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Available Champions */}
          <div className="max-h-50 lg:max-h-80 overflow-y-auto space-y-1">
            {unselectedChampions.map((champ) => (
              <Fragment key={champ.id}>
                <ChampionRow champ={champ} />
              </Fragment>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Selected {value.length} / {max}
          </p>
        </>
      )}

      {editingChampion && (
        <ChampionModal champion={editingChampion} onClose={handleEditClose} />
      )}

      {previewChampion && (
        <Modal isOpen title="Champion Preview" onClose={() => setPreviewChampion(null)}>
          <ChampionCard champion={previewChampion} />
        </Modal>
      )}
    </div>
  );
}
