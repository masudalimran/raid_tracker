import { useState, useMemo, useRef, useEffect } from "react";
import { FaTrash, FaPlus, FaEdit, FaCheck, FaTimes, FaCloudUploadAlt, FaCloudDownloadAlt, FaRedo, FaList, FaThLarge } from "react-icons/fa";
import { MdCasino } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import { ShardType, PullRarity, PITY_THRESHOLD } from "../models/IShard";
import type { IShardPull } from "../models/IShard";
import {
  loadShardPullsForActiveAccount,
  addShardPull,
  deleteShardPull,
  updateShardPull,
  getShardStats,
  ensureShardPullsLoaded,
  syncShardPullsToCloud,
  fetchShardPulls,
  resetPityForShardType,
} from "../helpers/handleShardPulls";
import { useChampion } from "../hooks/useChampion";
import DefaultChampionObject from "../components/forms/defaultChampionObject";
import type { ChampionFormData } from "../lib/zod/championSchema";
import type { ChampionRarity } from "../models/ChampionRarity";
import type { ChampionType } from "../models/ChampionType";
import Modal from "../components/modals/Modal";

// ── Champion lookup ───────────────────────────────────────────────────────────

interface ChampionInfo { rarity: string; imgUrl: string }

function loadChampionLookup(): Map<string, ChampionInfo> {
  try {
    const raw = JSON.parse(localStorage.getItem("supabase_champion_list") ?? "[]");
    return new Map(
      (raw as { name?: string; rarity?: string; imgUrl?: string }[])
        .filter((c) => c.name)
        .map((c) => [c.name!.toLowerCase(), { rarity: c.rarity ?? "", imgUrl: c.imgUrl ?? "" }]),
    );
  } catch {
    return new Map();
  }
}

const PULL_RARITY_MAP: Partial<Record<string, PullRarity>> = {
  Mythical:  PullRarity.MYTHICAL,
  Legendary: PullRarity.LEGENDARY,
  Epic:      PullRarity.EPIC,
  Rare:      PullRarity.RARE,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_SHARD_TYPES = Object.values(ShardType);
const ALL_RARITIES = Object.values(PullRarity).filter(
  (r) => r !== "Common" && r !== "Uncommon",
);

// Ancient & Void shards can't pull Legendary+ in practice and skew toward
// Rare; Sacred/Prism shards default to Epic since those are far more common.
function getDefaultRarity(shardType: string): PullRarity {
  return shardType === ShardType.ANCIENT || shardType === ShardType.VOID
    ? PullRarity.RARE
    : PullRarity.EPIC;
}

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

// Extra accent applied to whole pull rows so rare drops stand out.
const PULL_ROW_ACCENT: Record<string, string> = {
  Legendary: "border-amber-300 bg-gradient-to-r from-amber-50 via-white to-white ring-1 ring-amber-200 shadow-amber-100",
  Mythical:  "border-amber-300 bg-gradient-to-r from-amber-50 via-white to-white ring-1 ring-amber-200 shadow-amber-100",
  Epic:      "border-purple-200 bg-purple-50/50",
};

// ── Sub-components ────────────────────────────────────────────────────────────

// Donut chart showing the Epic / Rare / Other split of pulls for a shard type.
function PullDonut({ total, epic, rare }: { total: number; epic: number; rare: number }) {
  const other = Math.max(total - epic - rare, 0);
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const segments = [
    { value: epic,  color: "#9333ea" }, // purple-600
    { value: rare,  color: "#3b82f6" }, // blue-500
    { value: other, color: "#d1d5db" }, // gray-300
  ];

  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
      {total > 0 && segments.map((seg, i) => {
        if (seg.value === 0) return null;
        const length = (seg.value / total) * circumference;
        const dashoffset = -offset;
        offset += length;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={dashoffset}
          />
        );
      })}
    </svg>
  );
}

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

function ChampionAvatar({
  name,
  imgUrl,
  size = 44,
}: {
  name: string;
  imgUrl: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();

  if (imgUrl && !failed) {
    return (
      <img
        src={imgUrl}
        alt={name}
        onError={() => setFailed(true)}
        className="rounded-full object-cover bg-gray-100 shrink-0 border border-gray-200"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 border-2 border-green-400"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initial}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ShardLog() {
  const [pulls, setPulls] = useState<IShardPull[]>(() => loadShardPullsForActiveAccount());
  const [activeTab, setActiveTab] = useState<string>(ShardType.ANCIENT);
  const [championLookup, setChampionLookup] = useState<Map<string, ChampionInfo>>(() => loadChampionLookup());
  const { addChampion } = useChampion();

  const [form, setForm] = useState({
    championName: "",
    rarity: getDefaultRarity(ShardType.ANCIENT) as PullRarity,
    notes: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Log list search & filter
  const [logSearch, setLogSearch] = useState("");
  const [logRarityFilter, setLogRarityFilter] = useState<string>("rarity_all");
  const [logSort, setLogSort] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    championName: "",
    rarity: PullRarity.RARE as PullRarity,
    notes: "",
  });

  // Cloud sync
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "saved" | "error">("idle");
  const [fetchStatus, setFetchStatus] = useState<"idle" | "fetching" | "done" | "error">("idle");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  // Pity reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetReason, setResetReason] = useState<"manual" | "auto">("manual");
  const [resetStatus, setResetStatus] = useState<"idle" | "resetting" | "error">("idle");
  const [resetConfirmText, setResetConfirmText] = useState("");

  // Lazy-load from Supabase on first visit (e.g. a new browser/device with no local cache).
  useEffect(() => {
    ensureShardPullsLoaded().then(setPulls);
  }, []);

  const handleSync = async () => {
    setShowSyncConfirm(false);
    setSyncStatus("syncing");
    const result = await syncShardPullsToCloud(pulls);
    setSyncStatus(result.success ? "saved" : "error");
    setTimeout(() => setSyncStatus("idle"), 2000);
  };

  const handleFetch = async () => {
    setFetchStatus("fetching");
    try {
      const fetched = await fetchShardPulls();
      setPulls(fetched);
      setFetchStatus("done");
    } catch {
      setFetchStatus("error");
    }
    setTimeout(() => setFetchStatus("idle"), 2000);
  };

  const tabPulls = useMemo(
    () => pulls.filter((p) => p.shardType === activeTab),
    [pulls, activeTab],
  );

  const filteredTabPulls = useMemo(() => {
    let list = tabPulls;
    if (logSearch.trim()) {
      const lower = logSearch.trim().toLowerCase();
      list = list.filter((p) => p.championName.toLowerCase().includes(lower));
    }
    if (logRarityFilter !== "rarity_all") {
      list = list.filter((p) => p.rarity === logRarityFilter);
    }
    if (logSort === "oldest") {
      list = [...list].reverse();
    }
    return list;
  }, [tabPulls, logSearch, logRarityFilter, logSort]);

  const filtersActive = logSearch.trim() !== "" || logRarityFilter !== "rarity_all" || logSort !== "newest";

  const clearFilters = () => {
    setLogSearch("");
    setLogRarityFilter("rarity_all");
    setLogSort("newest");
  };

  const stats = useMemo(
    () => getShardStats(pulls, activeTab as typeof ShardType[keyof typeof ShardType]),
    [pulls, activeTab],
  );

  const handleNameChange = (value: string) => {
    setForm((f) => ({ ...f, championName: value }));
    setPreviewUrl("");
    if (value.trim().length >= 2) {
      const lower = value.toLowerCase();
      const rawNames = JSON.parse(
        localStorage.getItem("supabase_champion_list") ?? "[]",
      ) as { name?: string }[];
      const nameCased = [...new Set(
        rawNames
          .filter((c) => c.name?.toLowerCase().includes(lower))
          .map((c) => c.name!),
      )].slice(0, 6);
      setSuggestions(nameCased);
      setShowSuggestions(nameCased.length > 0);
      setActiveSuggestion(-1);
    } else {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const selectSuggestion = (name: string) => {
    const info = championLookup.get(name.toLowerCase());
    const mappedRarity = info ? PULL_RARITY_MAP[info.rarity] : undefined;
    setForm((f) => ({
      ...f,
      championName: name,
      rarity: (mappedRarity && (ALL_RARITIES as string[]).includes(mappedRarity)) ? mappedRarity : f.rarity,
    }));
    setPreviewUrl(info?.imgUrl ?? "");
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    inputRef.current?.focus();
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        return;
      }
      if (e.key === "Enter" && activeSuggestion >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestion]);
        return;
      }
    }
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      handleAdd();
    }
  };

  // Creates a new champion roster entry (same as adding via the Champions page)
  // when a pulled champion doesn't yet exist for the current RSL account.
  const createChampionFromPull = async (name: string, rarity: PullRarity): Promise<ChampionInfo | undefined> => {
    const { id: userId } = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
    const current_rsl_account = JSON.parse(
      localStorage.getItem("supabase_rsl_account_list") ?? "[]",
    ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

    if (!current_rsl_account || !userId) return undefined;

    const newChampionData = {
      ...DefaultChampionObject,
      name,
      rarity: "N/A" as unknown as ChampionRarity,
      type: "N/A" as unknown as ChampionType,
      user_id: userId,
      rsl_account_id: current_rsl_account.id,
    } as ChampionFormData;

    try {
      const inserted = await addChampion(newChampionData);
      const supabase_champions = JSON.parse(
        localStorage.getItem("supabase_champion_list") || "[]",
      );
      supabase_champions.push(inserted);
      localStorage.setItem("supabase_champion_list", JSON.stringify(supabase_champions));

      const newInfo: ChampionInfo = { rarity: inserted.rarity ?? rarity, imgUrl: inserted.imgUrl ?? "" };
      setChampionLookup((prev) => new Map(prev).set(name.toLowerCase(), newInfo));
      return newInfo;
    } catch (error) {
      console.error("Error adding champion from shard log:", error);
      return undefined;
    }
  };

  const handleAdd = async () => {
    const trimmedName = form.championName.trim();
    if (!trimmedName) return;
    setShowSuggestions(false);

    let info = championLookup.get(trimmedName.toLowerCase());
    if (!info) {
      info = await createChampionFromPull(trimmedName, form.rarity);
    }

    const entry = addShardPull({
      shardType:    activeTab as IShardPull["shardType"],
      championName: trimmedName,
      rarity:       form.rarity,
      pulledAt:     new Date().toISOString(),
      notes:        form.notes.trim() || undefined,
      imgUrl:       info?.imgUrl,
    });
    setPulls((prev) => [entry, ...prev]);
    setForm({ championName: "", rarity: getDefaultRarity(activeTab), notes: "" });
    setPreviewUrl("");
    inputRef.current?.focus();

    if (entry.rarity === PullRarity.LEGENDARY || entry.rarity === PullRarity.MYTHICAL) {
      setResetReason("auto");
      setResetConfirmText("");
      setShowResetConfirm(true);
    }
  };

  const closeResetConfirm = () => {
    setShowResetConfirm(false);
    setResetStatus("idle");
    setResetConfirmText("");
  };

  const handleResetPity = async () => {
    if (resetConfirmText.trim().toUpperCase() !== activeTab.toUpperCase()) return;
    setResetStatus("resetting");
    const result = await resetPityForShardType(activeTab as typeof ShardType[keyof typeof ShardType]);
    if (result.success) {
      setPulls(result.pulls);
      closeResetConfirm();
    } else {
      setResetStatus("error");
    }
  };

  const handleDelete = (id: string) => {
    deleteShardPull(id);
    setPulls((prev) => prev.filter((p) => p.id !== id));
  };

  const startEdit = (pull: IShardPull) => {
    setEditingId(pull.id);
    setEditForm({
      championName: pull.championName,
      rarity: pull.rarity,
      notes: pull.notes ?? "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    const trimmedName = editForm.championName.trim();
    if (!trimmedName) return;
    const info = championLookup.get(trimmedName.toLowerCase());
    const updated = updateShardPull(id, {
      championName: trimmedName,
      rarity: editForm.rarity,
      notes: editForm.notes.trim() || undefined,
      imgUrl: info?.imgUrl,
    });
    setPulls(updated);
    setEditingId(null);
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
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!showForm) {
                setForm((f) => ({ ...f, rarity: getDefaultRarity(activeTab) }));
              }
              setShowForm((v) => !v);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition cursor-pointer shrink-0"
          >
            <FaPlus size={11} /> Log Pull
          </button>
          <button
            type="button"
            onClick={() => {
              setResetReason("manual");
              setResetConfirmText("");
              setShowResetConfirm(true);
            }}
            title={`Clear the ${activeTab} pull log and reset its pity counter`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0"
          >
            <FaRedo size={11} /> Reset Pity
          </button>
          <button
            type="button"
            onClick={() => setShowSyncConfirm(true)}
            disabled={syncStatus === "syncing"}
            title="Save the shard log to the cloud so it's available on other devices"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border
              ${syncStatus === "error"
                ? "border-red-300 text-red-600 hover:bg-red-50"
                : syncStatus === "saved"
                ? "border-green-300 text-green-600 bg-green-50"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"}
              disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <FaCloudUploadAlt size={13} />
            {syncStatus === "syncing" ? "Saving…" : syncStatus === "saved" ? "Saved!" : syncStatus === "error" ? "Failed" : "Save to Cloud"}
          </button>
          <button
            type="button"
            onClick={handleFetch}
            disabled={fetchStatus === "fetching"}
            title="Fetch the shard log saved to the cloud for this account"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border
              ${fetchStatus === "error"
                ? "border-red-300 text-red-600 hover:bg-red-50"
                : fetchStatus === "done"
                ? "border-green-300 text-green-600 bg-green-50"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"}
              disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <FaCloudDownloadAlt size={13} />
            {fetchStatus === "fetching" ? "Fetching…" : fetchStatus === "done" ? "Fetched!" : fetchStatus === "error" ? "Failed" : "Fetch from Cloud"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ── Shard tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {ALL_SHARD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setActiveTab(type);
                setForm((f) => ({ ...f, rarity: getDefaultRarity(type) }));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer
                ${activeTab === type
                  ? `${SHARD_COLOR[type]} text-white shadow`
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="bg-white border rounded-xl shadow-sm p-4 flex items-center gap-5 flex-wrap">
          <div className="relative w-24 h-24 shrink-0">
            <PullDonut total={stats.total} epic={stats.epic} rare={stats.rare} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-gray-700">{stats.total}</span>
              <span className="text-[10px] text-gray-400">Total Pulls</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-48">
            {[
              { label: "Epic",  count: stats.epic, rate: stats.epicRate, dot: "bg-purple-600" },
              { label: "Rare",  count: stats.rare, rate: stats.rareRate, dot: "bg-blue-500" },
              {
                label: "Other",
                count: Math.max(stats.total - stats.epic - stats.rare, 0),
                rate: stats.total > 0
                  ? (100 - Number(stats.epicRate) - Number(stats.rareRate)).toFixed(2)
                  : "0.00",
                dot: "bg-gray-300",
              },
            ].map(({ label, count, rate, dot }) => (
              <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                <span className="text-sm font-semibold text-gray-700">{count}</span>
                <span className="text-xs text-gray-400">{label} · {rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pity bar ── */}
        <div className="bg-white border rounded-xl p-3">
          <PityBar count={stats.pityCount} max={PITY_THRESHOLD[activeTab as keyof typeof PITY_THRESHOLD]} />
        </div>

        {/* ── Log pull form ── */}
        {showForm && (
          <div
            className="border rounded-xl p-4 bg-gray-50 space-y-3"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          >
            <div className="flex items-center gap-3">
              <ChampionAvatar name={form.championName || "?"} imgUrl={previewUrl} size={52} />
              <h3 className="text-sm font-semibold">
                Log a Pull — {activeTab} Shard
                {form.championName && (
                  <span className="ml-1 text-gray-400 font-normal">· {form.championName}</span>
                )}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 relative">
                <label className="text-xs font-medium text-gray-600">Champion Name</label>
                <input
                  ref={inputRef}
                  value={form.championName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Kael"
                  className="basic-input w-full"
                  onKeyDown={handleNameKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                  autoFocus
                />
                {showSuggestions && (
                  <ul className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((name, i) => {
                      const info = championLookup.get(name.toLowerCase());
                      return (
                        <li
                          key={name}
                          onMouseDown={() => selectSuggestion(name)}
                          onMouseEnter={() => setActiveSuggestion(i)}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition ${
                            i === activeSuggestion ? "bg-amber-50 text-amber-700" : "hover:bg-amber-50 hover:text-amber-700"
                          }`}
                        >
                          <ChampionAvatar name={name} imgUrl={info?.imgUrl ?? ""} size={28} />
                          <div className="min-w-0">
                            <span className="text-sm">{name}</span>
                            {info?.rarity && (
                              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${RARITY_COLOR[info.rarity] ?? ""}`}>
                                {info.rarity}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Rarity</label>
                <select
                  value={form.rarity}
                  onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value as PullRarity }))}
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
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Event, lucky pull, etc."
                className="basic-input w-full"
              />
            </div>


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
                onClick={() => { setShowForm(false); setPreviewUrl(""); }}
                className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Pull list search & filter ── */}
        {tabPulls.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-40">
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search pulled champions…"
                className="basic-input w-full pr-8"
              />
              <CiSearch
                size={18}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            <select
              value={logRarityFilter}
              onChange={(e) => setLogRarityFilter(e.target.value)}
              className="basic-input w-auto"
            >
              <option value="rarity_all">All Rarities</option>
              {ALL_RARITIES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={logSort}
              onChange={(e) => setLogSort(e.target.value as "newest" | "oldest")}
              className="basic-input w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-500 hover:bg-gray-100 transition cursor-pointer shrink-0"
              >
                <FaTimes size={11} /> Clear Filters
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto shrink-0">
              Showing {filteredTabPulls.length} of {tabPulls.length} pulls
            </span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List view"
                className={`p-1.5 transition cursor-pointer ${viewMode === "list" ? "bg-amber-500 text-white" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <FaList size={12} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`p-1.5 transition cursor-pointer ${viewMode === "grid" ? "bg-amber-500 text-white" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <FaThLarge size={12} />
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
        ) : filteredTabPulls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <CiSearch size={40} className="opacity-30" />
            <p className="text-sm">No pulls match your search/filter.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2" : "space-y-2"}>
            {filteredTabPulls.map((pull) => {
              const imgUrl = (pull as IShardPull & { imgUrl?: string }).imgUrl
                ?? championLookup.get(pull.championName.toLowerCase())?.imgUrl
                ?? "";
              const isEditing = editingId === pull.id;
              const accent = PULL_ROW_ACCENT[pull.rarity] ?? "border-gray-200";

              if (isEditing) {
                return (
                  <div
                    key={pull.id}
                    className={`flex flex-col gap-2 bg-white border-2 border-amber-300 rounded-xl px-3 py-2.5 shadow-sm ${viewMode === "grid" ? "col-span-full" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChampionAvatar name={editForm.championName || "?"} imgUrl={imgUrl} size={40} />
                      <input
                        value={editForm.championName}
                        onChange={(e) => setEditForm((f) => ({ ...f, championName: e.target.value }))}
                        className="basic-input flex-1 min-w-0"
                        placeholder="Champion name"
                        autoFocus
                      />
                      <select
                        value={editForm.rarity}
                        onChange={(e) => setEditForm((f) => ({ ...f, rarity: e.target.value as PullRarity }))}
                        className="basic-input w-auto shrink-0"
                      >
                        {ALL_RARITIES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      className="basic-input w-full"
                      placeholder="Notes (optional)"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => saveEdit(pull.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition cursor-pointer"
                      >
                        <FaCheck size={11} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
                      >
                        <FaTimes size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              if (viewMode === "grid") {
                return (
                  <div
                    key={pull.id}
                    className={`flex flex-col items-center text-center gap-1.5 border rounded-xl px-2 py-3 shadow-sm ${accent}`}
                  >
                    <ChampionAvatar name={pull.championName} imgUrl={imgUrl} size={48} />
                    <span className="font-semibold text-sm truncate w-full">{pull.championName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${RARITY_COLOR[pull.rarity] ?? ""}`}>
                      {pull.rarity}
                    </span>
                    {pull.notes && (
                      <p className="text-xs text-gray-400 truncate w-full">{pull.notes}</p>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(pull.pulledAt).toLocaleDateString()}{" "}
                      {new Date(pull.pulledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(pull)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition cursor-pointer shrink-0"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pull.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition cursor-pointer shrink-0"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={pull.id}
                  className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 shadow-sm ${accent}`}
                >
                  <ChampionAvatar name={pull.championName} imgUrl={imgUrl} size={40} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{pull.championName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${RARITY_COLOR[pull.rarity] ?? ""}`}>
                        {pull.rarity}
                      </span>
                    </div>
                    {pull.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{pull.notes}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 shrink-0 text-right">
                    {new Date(pull.pulledAt).toLocaleDateString()}
                    <br />
                    {new Date(pull.pulledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(pull)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition cursor-pointer shrink-0"
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(pull.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition cursor-pointer shrink-0"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reset pity confirmation ── */}
      <Modal
        isOpen={showResetConfirm}
        title={resetReason === "auto" ? "Legendary Pulled! Reset Pity?" : "Reset Pity Counter"}
        onClose={closeResetConfirm}
      >
        <p className="text-sm text-gray-600 mb-3">
          {resetReason === "auto"
            ? `Nice pull! Resetting pity will permanently delete all logged ${activeTab} shard pulls for this account — locally and in the cloud — and bring the pity counter back to 0.`
            : `This will permanently delete all logged ${activeTab} shard pulls for this account — locally and in the cloud — and reset the pity counter to 0.`}
        </p>
        <p className="text-sm text-red-600 font-semibold mb-3">This cannot be undone.</p>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Type <span className="font-mono font-bold text-gray-800">{activeTab.toUpperCase()}</span> to confirm
        </label>
        <input
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder={activeTab.toUpperCase()}
          className="basic-input w-full mb-3"
          autoComplete="off"
          autoFocus
        />
        {resetStatus === "error" && (
          <p className="text-xs text-red-500 mb-3">Something went wrong while resetting. Please try again.</p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={closeResetConfirm}
            className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            {resetReason === "auto" ? "Keep Log" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleResetPity}
            disabled={resetStatus === "resetting" || resetConfirmText.trim().toUpperCase() !== activeTab.toUpperCase()}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetStatus === "resetting" ? "Resetting…" : "Reset Pity"}
          </button>
        </div>
      </Modal>

      {/* ── Save to cloud confirmation ── */}
      <Modal
        isOpen={showSyncConfirm}
        title="Save to Cloud"
        onClose={() => setShowSyncConfirm(false)}
      >
        <p className="text-sm text-gray-600 mb-4">
          This will overwrite the cloud copy of this account&apos;s shard pull log with your current local data, making it available on other devices/browsers. Continue?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setShowSyncConfirm(false)}
            className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition cursor-pointer font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {syncStatus === "syncing" ? "Saving…" : "Save to Cloud"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
