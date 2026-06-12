import { useState, useMemo, useRef, useEffect } from "react";
import { FaTrash, FaPlus, FaEdit, FaCheck, FaTimes, FaCloudUploadAlt, FaCloudDownloadAlt } from "react-icons/fa";
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
} from "../helpers/handleShardPulls";
import { useChampion } from "../hooks/useChampion";
import DefaultChampionObject from "../components/forms/defaultChampionObject";
import type { ChampionFormData } from "../lib/zod/championSchema";
import type { ChampionRarity } from "../models/ChampionRarity";

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
    isFragment: false,
    notes: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Log list search & filter
  const [logSearch, setLogSearch] = useState("");
  const [logRarityFilter, setLogRarityFilter] = useState<string>("rarity_all");

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

  // Lazy-load from Supabase on first visit (e.g. a new browser/device with no local cache).
  useEffect(() => {
    ensureShardPullsLoaded().then(setPulls);
  }, []);

  const handleSync = async () => {
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
    return list;
  }, [tabPulls, logSearch, logRarityFilter]);

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
    } else {
      setShowSuggestions(false);
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
    inputRef.current?.focus();
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
      rarity: rarity as unknown as ChampionRarity,
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
      isFragment:   form.isFragment,
      notes:        form.notes.trim() || undefined,
      imgUrl:       info?.imgUrl,
    });
    setPulls((prev) => [entry, ...prev]);
    setForm({ championName: "", rarity: getDefaultRarity(activeTab), isFragment: false, notes: "" });
    setPreviewUrl("");
    inputRef.current?.focus();
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
            onClick={handleSync}
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

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Pulls", value: stats.total,             color: "text-gray-700" },
            { label: "Legendary",   value: stats.legendary,          color: "text-amber-600" },
            { label: "Epic",        value: stats.epic,               color: "text-purple-600" },
            { label: "Leg. Rate",   value: `${stats.legendaryRate}%`, color: "text-green-600" },
            { label: "Epic Rate",   value: `${stats.epicRate}%`,      color: "text-purple-500" },
            { label: "Rare Rate",   value: `${stats.rareRate}%`,      color: "text-blue-500" },
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
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                  autoFocus
                />
                {showSuggestions && (
                  <ul className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((name) => {
                      const info = championLookup.get(name.toLowerCase());
                      return (
                        <li
                          key={name}
                          onMouseDown={() => selectSuggestion(name)}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition"
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

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFragment}
                onChange={(e) => setForm((f) => ({ ...f, isFragment: e.target.checked }))}
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
          <div className="space-y-2">
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
                    className="flex flex-col gap-2 bg-white border-2 border-amber-300 rounded-xl px-3 py-2.5 shadow-sm"
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
    </div>
  );
}
