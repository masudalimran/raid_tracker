import { useMemo, useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { getShardImagePath } from "../../helpers/getShardImage";

interface ShardTier {
  key: string;
  label: string;
  points: number;
  border: string;
}

const SHARD_TIERS: ShardTier[] = [
  { key: "mystery", label: "Mystery Shard", points: 1,   border: "border-pink-400" },
  { key: "ancient", label: "Ancient Shard", points: 20,  border: "border-amber-500" },
  { key: "void",    label: "Void Shard",    points: 120, border: "border-purple-600" },
  { key: "primal",  label: "Primal Shard",  points: 200, border: "border-rose-600" },
  { key: "sacred",  label: "Sacred Shard",  points: 500, border: "border-yellow-400" },
];

const EMPTY_COUNTS = Object.fromEntries(SHARD_TIERS.map((t) => [t.key, ""]));

export default function SummonRush() {
  const [counts, setCounts] = useState<Record<string, string>>(EMPTY_COUNTS);

  const parsedCounts = useMemo(
    () => Object.fromEntries(
      SHARD_TIERS.map((t) => [t.key, Math.max(0, Math.floor(Number(counts[t.key]) || 0))]),
    ),
    [counts],
  );

  const totalPoints = useMemo(
    () => SHARD_TIERS.reduce((sum, t) => sum + parsedCounts[t.key] * t.points, 0),
    [parsedCounts],
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

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Points</p>
        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalPoints.toLocaleString()}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
        {SHARD_TIERS.map((tier) => (
          <div key={tier.key} className="flex items-center gap-3 px-4 py-3">
            <img
              src={getShardImagePath(tier.key)}
              alt={tier.label}
              className={`w-10 h-10 rounded-lg object-cover border-2 shrink-0 ${tier.border}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{tier.label}</p>
              <p className="text-[11px] text-gray-400">{tier.points} pt{tier.points !== 1 ? "s" : ""} each</p>
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
              {(parsedCounts[tier.key] * tier.points).toLocaleString()} pts
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
