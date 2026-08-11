import { useEffect, useMemo, useState } from "react";
import { MdClose, MdCompareArrows } from "react-icons/md";
import { FaSearch } from "react-icons/fa";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import ChampionCard from "../components/card/ChampionCard";
import { generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import { getChampionRating, type ChampionRatingBreakdown } from "../helpers/getChampionRating";
import { getBuildQuality } from "../helpers/getChampionBuildQuality";
import { checkIfChampionIsBuilt } from "../helpers/checkIfChampionIsBuilt";
import { formatNumber } from "../helpers/formatNumber";
import { addToCompareList, removeFromCompareList, MAX_COMPARE } from "../helpers/compareList";
import { useCompareList } from "../hooks/useCompareList";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";

const MIN_FOR_TABLE = 2;

const BUILD_LABEL: Record<string, string> = {
  built: "Built ✓",
  needs_improvement: "Needs Improvement",
  needs_level: "Need Level",
  not_built: "Not Built",
  untouched: "Untouched",
};

type NumericStatKey = "hp" | "atk" | "def" | "spd" | "c_rate" | "c_dmg" | "res" | "acc";
const STAT_ROWS: { label: string; key: NumericStatKey }[] = [
  { label: "HP", key: "hp" },
  { label: "ATK", key: "atk" },
  { label: "DEF", key: "def" },
  { label: "SPD", key: "spd" },
  { label: "C.Rate", key: "c_rate" },
  { label: "C.DMG", key: "c_dmg" },
  { label: "RES", key: "res" },
  { label: "ACC", key: "acc" },
];

// ── Add-champion search picker ───────────────────────────────────────────

function AddChampionPicker({
  champions,
  excludeIds,
  onPick,
}: {
  champions: IChampion[];
  excludeIds: Set<string>;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    if (query.trim().length < 1) return [];
    const lower = query.toLowerCase();
    const seen = new Set<string>();
    const hits: IChampion[] = [];
    for (const c of champions) {
      const id = String(c.id);
      if (excludeIds.has(id) || seen.has(id)) continue;
      if (!c.name.toLowerCase().includes(lower)) continue;
      seen.add(id);
      hits.push(c);
      if (hits.length === 8) break;
    }
    return hits;
  }, [query, champions, excludeIds]);

  const pick = (id: string) => {
    onPick(id);
    setQuery("");
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full min-h-55 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4">
      <FaSearch className="text-gray-300 dark:text-gray-600" size={20} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Add a champion…"
        className="basic-input w-full pr-3"
      />
      {matches.length > 0 && (
        <ul className="absolute top-full left-2 right-2 mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => pick(String(c.id))}
                className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
              >
                {c.imgUrl ? (
                  <img src={c.imgUrl} alt="" className="w-7 h-7 rounded-full object-cover object-top shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                )}
                <span className="text-sm flex-1 truncate">{c.name}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{c.rarity}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────

interface RowValue {
  id: string;
  display: string;
  value: number;
}

function ComparisonRow({ label, values }: { label: string; values: RowValue[] }) {
  const max = Math.max(...values.map((v) => v.value));
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800/60">
      <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{label}</td>
      {values.map((v) => (
        <td
          key={v.id}
          className={`px-3 py-2 font-medium ${
            max > 0 && v.value === max
              ? "text-green-600 dark:text-green-400 font-bold"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {v.display}
        </td>
      ))}
    </tr>
  );
}

function ComparisonTable({
  champions,
  ratings,
  teams,
}: {
  champions: IChampion[];
  ratings: Map<string, ChampionRatingBreakdown>;
  teams: ITeam[];
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="text-left px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">
              Stat
            </th>
            {champions.map((c) => (
              <th key={c.id} className="px-3 py-2 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  {c.imgUrl && (
                    <img src={c.imgUrl} alt="" className="w-6 h-6 rounded-full object-cover object-top shrink-0" />
                  )}
                  <span className="font-semibold truncate max-w-[9rem]">{c.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <ComparisonRow
            label="Rating"
            values={champions.map((c) => {
              const r = ratings.get(String(c.id));
              return { id: String(c.id), display: r ? `${r.score.toFixed(1)}/10` : "—", value: r?.score ?? 0 };
            })}
          />
          <tr className="border-b border-gray-50 dark:border-gray-800/60">
            <td className="px-3 py-2 text-xs text-gray-400">Archetype</td>
            {champions.map((c) => (
              <td key={c.id} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                {ratings.get(String(c.id))?.archetypeLabel ?? "—"}
              </td>
            ))}
          </tr>
          <ComparisonRow
            label="Level"
            values={champions.map((c) => ({ id: String(c.id), display: `${c.level}`, value: c.level }))}
          />
          <ComparisonRow
            label="Stars"
            values={champions.map((c) => ({ id: String(c.id), display: `${c.stars}★`, value: c.stars }))}
          />
          {STAT_ROWS.map((row) => (
            <ComparisonRow
              key={row.key}
              label={row.label}
              values={champions.map((c) => ({
                id: String(c.id),
                display: formatNumber(c[row.key]),
                value: c[row.key],
              }))}
            />
          ))}
          <tr className="border-b border-gray-50 dark:border-gray-800/60">
            <td className="px-3 py-2 text-xs text-gray-400">Book</td>
            {champions.map((c) => (
              <td key={c.id} className="px-3 py-2">{c.is_booked ? "✓" : "—"}</td>
            ))}
          </tr>
          <tr className="border-b border-gray-50 dark:border-gray-800/60">
            <td className="px-3 py-2 text-xs text-gray-400">Mastery</td>
            {champions.map((c) => (
              <td key={c.id} className="px-3 py-2">{c.has_mastery ? "✓" : "—"}</td>
            ))}
          </tr>
          <ComparisonRow
            label="Teams"
            values={champions.map((c) => {
              const count = teams.filter((t) => t.champion_ids.includes(String(c.id))).length;
              return { id: String(c.id), display: `${count}`, value: count };
            })}
          />
          <tr>
            <td className="px-3 py-2 text-xs text-gray-400">Build Status</td>
            {champions.map((c) => (
              <td key={c.id} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                {BUILD_LABEL[getBuildQuality(c, checkIfChampionIsBuilt(c))]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function ChampionComparison() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);

  // The comparison list is shared app-wide — the same list the Compare
  // button on every ChampionCard and the topbar icon read/write.
  const compareIds = useCompareList();

  useEffect(() => {
    const load = async () => {
      const [champs, fetchedTeams] = await Promise.all([generateChampions(), fetchTeams()]);
      setChampions(champs);
      setTeams(fetchedTeams);
      setLoading(false);
    };
    load();
  }, []);

  const selectedChampions = useMemo(
    () =>
      compareIds
        .map((id) => champions.find((c) => String(c.id) === id))
        .filter((c): c is IChampion => !!c),
    [compareIds, champions],
  );

  const ratings = useMemo(
    () => new Map(selectedChampions.map((c) => [String(c.id), getChampionRating(c, teams)])),
    [selectedChampions, teams],
  );

  if (loading) return <ArcaneLoader label="Loading your roster" />;

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MdCompareArrows className="text-amber-500" size={22} />
            Champion Comparison
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tap the compare icon on any champion card to add it here, or search below — up to {MAX_COMPARE} at a time.
          </p>
        </div>
        {selectedChampions.length > 0 && (
          <button
            type="button"
            onClick={() => selectedChampions.forEach((c) => removeFromCompareList(c.id))}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition cursor-pointer shrink-0"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {selectedChampions.map((champion) => (
          <div key={champion.id} className="relative">
            <button
              type="button"
              onClick={() => removeFromCompareList(champion.id)}
              title="Remove"
              className="absolute -top-2 -right-2 z-30 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-red-500 transition cursor-pointer shadow"
            >
              <MdClose size={14} />
            </button>
            <ChampionCard champion={champion} />
          </div>
        ))}
        {selectedChampions.length < MAX_COMPARE && (
          <AddChampionPicker
            champions={champions}
            excludeIds={new Set(compareIds)}
            onPick={addToCompareList}
          />
        )}
      </div>

      {selectedChampions.length >= MAX_COMPARE && (
        <p className="text-xs text-gray-400">
          Comparison list is full ({MAX_COMPARE}/{MAX_COMPARE}). Remove one to add another.
        </p>
      )}

      {selectedChampions.length >= MIN_FOR_TABLE ? (
        <ComparisonTable champions={selectedChampions} ratings={ratings} teams={teams} />
      ) : (
        <p className="text-center text-sm text-gray-400 py-6">
          Add at least {MIN_FOR_TABLE} champions to see a side-by-side comparison.
        </p>
      )}
    </div>
  );
}
