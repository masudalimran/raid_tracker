import { useMemo, useState } from "react";
import { FaCaretDown, FaCaretUp, FaCheck, FaCog, FaTimes, FaUndo } from "react-icons/fa";
import { getSoulImagePath } from "../../helpers/getSoulImage";
import { DEFAULT_SOUL_POINTS, getSoulPoints, resetSoulPoints, saveSoulPoints } from "../../helpers/deckOfFatePoints";

interface SoulTier {
  key: string;
  label: string;
  border: string;
}

const SOUL_TIERS: SoulTier[] = [
  { key: "mortal",    label: "Mortal Soulstone",    border: "border-slate-400" },
  { key: "immortal",  label: "Immortal Soulstone",  border: "border-indigo-500" },
  { key: "eternal",   label: "Eternal Soulstone",   border: "border-amber-500" },
];

const EMPTY_COUNTS = Object.fromEntries(SOUL_TIERS.map((t) => [t.key, ""]));

export default function DeckOfFate() {
  const [counts, setCounts] = useState<Record<string, string>>(EMPTY_COUNTS);
  const [points, setPoints] = useState<Record<string, number>>(getSoulPoints);
  const [editingSettings, setEditingSettings] = useState(false);
  const [draftPoints, setDraftPoints] = useState<Record<string, string>>({});

  const parsedCounts = useMemo(
    () => Object.fromEntries(
      SOUL_TIERS.map((t) => [t.key, Math.max(0, Math.floor(Number(counts[t.key]) || 0))]),
    ),
    [counts],
  );

  const totalPoints = useMemo(
    () => SOUL_TIERS.reduce((sum, t) => sum + parsedCounts[t.key] * (points[t.key] ?? 0), 0),
    [parsedCounts, points],
  );

  const setCount = (key: string, value: string) => {
    setCounts((prev) => ({ ...prev, [key]: value }));
  };

  const step = (key: string, delta: number) => {
    setCounts((prev) => {
      const current = Math.max(0, Math.floor(Number(prev[key]) || 0));
      return { ...prev, [key]: String(Math.max(0, current + delta)) };
    });
  };

  const clearAll = () => setCounts(EMPTY_COUNTS);

  const hasAnyInput = Object.values(counts).some((v) => v.trim() !== "");

  const openSettings = () => {
    setDraftPoints(Object.fromEntries(SOUL_TIERS.map((t) => [t.key, String(points[t.key] ?? 0)])));
    setEditingSettings(true);
  };
  const cancelSettings = () => setEditingSettings(false);
  const saveSettings = () => {
    const next = { ...points };
    for (const tier of SOUL_TIERS) {
      const parsed = Math.max(0, Math.floor(Number(draftPoints[tier.key]) || 0));
      next[tier.key] = parsed;
    }
    setPoints(next);
    saveSoulPoints(next);
    setEditingSettings(false);
  };
  const resetSettings = () => {
    setPoints({ ...DEFAULT_SOUL_POINTS });
    resetSoulPoints();
    setEditingSettings(false);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Points</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalPoints.toLocaleString()}</p>
        </div>
        {!editingSettings && (
          <button
            type="button"
            onClick={openSettings}
            title="Edit point values"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer shrink-0"
          >
            <FaCog size={11} /> Points
          </button>
        )}
      </div>

      {editingSettings && (
        <div className="bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Point Values</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveSettings}
                className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-semibold cursor-pointer"
              >
                <FaCheck size={10} /> Save
              </button>
              <button
                type="button"
                onClick={resetSettings}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaUndo size={10} /> Reset to defaults
              </button>
              <button
                type="button"
                onClick={cancelSettings}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <FaTimes size={10} /> Cancel
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {SOUL_TIERS.map((tier) => (
              <div key={tier.key} className="flex items-center gap-3">
                <span className="text-sm flex-1 min-w-0 truncate">{tier.label}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftPoints[tier.key] ?? ""}
                  onChange={(e) => setDraftPoints((prev) => ({ ...prev, [tier.key]: e.target.value }))}
                  className="basic-input w-28 text-left pr-3"
                />
                <span className="text-xs text-gray-400 w-3 shrink-0">pt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
        {SOUL_TIERS.map((tier) => (
          <div key={tier.key} className="flex items-center gap-3 px-4 py-3">
            <img
              src={getSoulImagePath(tier.key)}
              alt={tier.label}
              className={`w-10 h-10 rounded-lg object-cover border-2 shrink-0 ${tier.border}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{tier.label}</p>
              <p className="text-[11px] text-gray-400">
                {(points[tier.key] ?? 0).toLocaleString()} pt{points[tier.key] !== 1 ? "s" : ""} each
              </p>
            </div>
            <div className="relative w-24 shrink-0">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={counts[tier.key]}
                onChange={(e) => setCount(tier.key, e.target.value)}
                placeholder="0"
                className="basic-input w-full text-left pr-6 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => step(tier.key, 1)}
                  className="flex items-center justify-center h-3.5 w-4 text-gray-400 hover:text-amber-500 transition cursor-pointer"
                >
                  <FaCaretUp size={11} />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => step(tier.key, -1)}
                  className="flex items-center justify-center h-3.5 w-4 text-gray-400 hover:text-amber-500 transition cursor-pointer"
                >
                  <FaCaretDown size={11} />
                </button>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-20 text-right shrink-0">
              {(parsedCounts[tier.key] * (points[tier.key] ?? 0)).toLocaleString()} pts
            </span>
          </div>
        ))}
      </div>

      {hasAnyInput && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-semibold text-gray-400 hover:text-red-500 transition cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
