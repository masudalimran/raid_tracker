import { useState, useMemo } from "react";
import { FaTrash, FaPlus } from "react-icons/fa";
import { MdCasino } from "react-icons/md";
import { ShardType, PullRarity, PITY_THRESHOLD } from "../models/IShard";
import type { IShardPull } from "../models/IShard";
import {
  loadShardPulls,
  addShardPull,
  deleteShardPull,
  getShardStats,
} from "../helpers/handleShardPulls";

const ALL_SHARD_TYPES = Object.values(ShardType);
const ALL_RARITIES = Object.values(PullRarity).filter((r) => r !== "Common" && r !== "Uncommon");

const SHARD_COLOR: Record<string, string> = {
  Ancient: "bg-amber-500",
  Void:    "bg-purple-600",
  Sacred:  "bg-yellow-400",
  Prism:   "bg-cyan-500",
};

const RARITY_COLOR: Record<string, string> = {
  Common:    "bg-gray-200 text-gray-600",
  Uncommon:  "bg-green-100 text-green-700",
  Rare:      "bg-blue-100 text-blue-700",
  Epic:      "bg-purple-100 text-purple-700",
  Legendary: "bg-amber-100 text-amber-800 font-semibold",
  Mythical:  "bg-red-100 text-red-700 font-semibold",
};

function PityBar({ count, max }: { count: number; max: number }) {
  const pct = Math.min((count / max) * 100, 100);
  const danger = pct >= 80;
  const warn   = pct >= 50;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>Pity</span>
        <span className={danger ? "text-red-500 font-bold" : warn ? "text-amber-500" : ""}>
          {count} / {max}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${danger ? "bg-red-400" : warn ? "bg-amber-400" : "bg-green-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ShardLog() {
  const [pulls, setPulls] = useState<IShardPull[]>(() => loadShardPulls());
  const [activeTab, setActiveTab] = useState<string>(ShardType.ANCIENT);

  const [form, setForm] = useState({
    championName: "",
    rarity: PullRarity.EPIC as PullRarity,
    isFragment: false,
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);

  const tabPulls = useMemo(
    () => pulls.filter((p) => p.shardType === activeTab),
    [pulls, activeTab],
  );

  const stats = useMemo(
    () => getShardStats(pulls, activeTab as typeof ShardType[keyof typeof ShardType]),
    [pulls, activeTab],
  );

  const handleAdd = () => {
    if (!form.championName.trim()) return;
    const entry = addShardPull({
      shardType:    activeTab as IShardPull["shardType"],
      championName: form.championName.trim(),
      rarity:       form.rarity,
      pulledAt:     new Date().toISOString(),
      isFragment:   form.isFragment,
      notes:        form.notes.trim() || undefined,
    });
    setPulls((prev) => [entry, ...prev]);
    setForm({ championName: "", rarity: PullRarity.EPIC, isFragment: false, notes: "" });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteShardPull(id);
    setPulls((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="page-header flex-col md:flex-row">
        <div>
          <h1 className="text-base font-bold text-gray-900">Shard Pull Log</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Track every pull, monitor pity counters, and see your rates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition cursor-pointer shrink-0"
        >
          <FaPlus size={11} /> Log Pull
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ── Shard tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {ALL_SHARD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTab(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer
                ${activeTab === type
                  ? `${SHARD_COLOR[type]} text-white shadow`
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Pulls",  value: stats.total,           color: "text-gray-700" },
            { label: "Legendary",    value: stats.legendary,        color: "text-amber-600" },
            { label: "Epic",         value: stats.epic,             color: "text-purple-600" },
            { label: "Leg. Rate",    value: `${stats.legendaryRate}%`, color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border rounded-xl p-3 text-center shadow-sm">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Pity bar ── */}
        <div className="bg-white border rounded-xl p-3">
          <PityBar count={stats.pityCount} max={PITY_THRESHOLD[activeTab as keyof typeof PITY_THRESHOLD]} />
        </div>

        {/* ── Log pull form ── */}
        {showForm && (
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <h3 className="text-sm font-semibold">Log a Pull — {activeTab} Shard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Champion Name</label>
                <input
                  value={form.championName}
                  onChange={(e) => setForm({ ...form, championName: e.target.value })}
                  placeholder="e.g. Kael"
                  className="basic-input w-full"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Rarity</label>
                <select
                  value={form.rarity}
                  onChange={(e) => setForm({ ...form, rarity: e.target.value as PullRarity })}
                  className="basic-input w-full"
                >
                  {ALL_RARITIES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Event, lucky pull, etc."
                className="basic-input w-full"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFragment}
                onChange={(e) => setForm({ ...form, isFragment: e.target.checked })}
                className="rounded"
              />
              Fragment fusion
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold"
              >
                Save Pull
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Pull list ── */}
        {tabPulls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <MdCasino size={40} className="opacity-30" />
            <p className="text-sm">No pulls logged for {activeTab} shards yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tabPulls.map((pull) => (
              <div
                key={pull.id}
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{pull.championName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${RARITY_COLOR[pull.rarity] ?? ""}`}>
                      {pull.rarity}
                    </span>
                    {pull.isFragment && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600">
                        Fragment
                      </span>
                    )}
                  </div>
                  {pull.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{pull.notes}</p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(pull.pulledAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(pull.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition cursor-pointer shrink-0"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
