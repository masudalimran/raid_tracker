import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBook, FaCheckCircle, FaEdit, FaLevelUpAlt, FaShieldAlt } from "react-icons/fa";
import { MdOutlineAutoAwesome } from "react-icons/md";
import { supabase } from "../lib/supabaseClient";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import { checkIfChampionIsBuilt } from "../helpers/checkIfChampionIsBuilt";
import { getBuildQuality } from "../helpers/getChampionBuildQuality";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import ChampionCard from "../components/card/ChampionCard";
import ChampionModal from "../components/modals/ChampionModal";
import Modal from "../components/modals/Modal";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionRole } from "../models/ChampionRole";
import colorByRarity from "../helpers/colorByRarity";

// ── Priority scorer ───────────────────────────────────────────────────────────

const RARITY_SCORE: Record<string, number> = {
  [ChampionRarity.MYTHICAL]:  60,
  [ChampionRarity.LEGENDARY]: 50,
  [ChampionRarity.EPIC]:      40,
  [ChampionRarity.RARE]:      30,
  [ChampionRarity.UNCOMMON]:  20,
  [ChampionRarity.COMMON]:    10,
};

const HIGH_VALUE_ROLES: ChampionRole[] = [
  ChampionRole.POISONER,
  ChampionRole.HP_BURNER,
  ChampionRole.NUKER,
  ChampionRole.SPEED_BOOSTER,
  ChampionRole.TM_REDUCER,
  ChampionRole.REVIVER,
  ChampionRole.DEBUFFER,
  ChampionRole.BLOCK_BUFF,
  ChampionRole.UNKILLABLE,
  ChampionRole.CLEANSER,
  ChampionRole.PROVOKER,
];

function highValueRoleCount(champion: IChampion): number {
  return (champion.role ?? []).filter((r) => HIGH_VALUE_ROLES.includes(r as ChampionRole)).length;
}

// Books: rarity matters (rarer tomes are scarcer, so prioritize using them well).
function priorityScore(
  champion: IChampion,
  teamCount: number,
): number {
  let score = 0;
  score += teamCount * 100;                                       // teams carry the most weight
  score += RARITY_SCORE[champion.rarity] ?? 0;
  if (checkIfChampionIsBuilt(champion)) score += 30;             // built = higher urgency
  score += highValueRoleCount(champion) * 10;
  return score;
}

// Masteries: free to pick regardless of rarity, so rarity plays no part —
// just how much the champion is actually used and how valuable its roles are.
function masteryPriorityScore(
  champion: IChampion,
  teamCount: number,
): number {
  let score = 0;
  score += teamCount * 100;
  if (checkIfChampionIsBuilt(champion)) score += 30;
  score += highValueRoleCount(champion) * 10;
  return score;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOK_RARITY_ORDER = [
  ChampionRarity.MYTHICAL,
  ChampionRarity.LEGENDARY,
  ChampionRarity.EPIC,
  ChampionRarity.RARE,
];

const MASTERY_RARITY_ORDER = [
  ChampionRarity.MYTHICAL,
  ChampionRarity.LEGENDARY,
  ChampionRarity.EPIC,
  ChampionRarity.RARE,
  ChampionRarity.UNCOMMON,
  ChampionRarity.COMMON,
];

const RARITY_BADGE: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  [ChampionRarity.LEGENDARY]: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  [ChampionRarity.EPIC]:      "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  [ChampionRarity.RARE]:      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  [ChampionRarity.UNCOMMON]:  "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
  [ChampionRarity.COMMON]:    "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
};

// ── Sub-components ────────────────────────────────────────────────────────────

const RARITY_TEXT: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "text-red-600",
  [ChampionRarity.LEGENDARY]: "text-orange-600",
  [ChampionRarity.EPIC]:      "text-purple-600",
  [ChampionRarity.RARE]:      "text-blue-600",
  [ChampionRarity.UNCOMMON]:  "text-green-600",
  [ChampionRarity.COMMON]:    "text-gray-500",
};

function ChampionPortrait({
  champion,
  badge,
  onClick,
}: {
  champion: IChampion;
  badge?: string;
  onClick?: (champion: IChampion) => void;
}) {
  const [failed, setFailed] = useState(false);
  const initial = champion.name.charAt(0).toUpperCase();

  // SVG constants — 64px container, 44px portrait, text arc just outside border
  const S = 64;          // total SVG / container size
  const IMG = 44;        // portrait circle diameter
  const OFF = (S - IMG) / 2; // = 10, centers portrait inside SVG
  const CX = S / 2;     // = 32
  const CY = S / 2;     // = 32
  const R  = 30;         // arc radius — sits just outside the portrait border
  const arcId = `rq-arc-${champion.id}`;

  const portraitContent = champion.imgUrl && !failed ? (
    <img
      src={champion.imgUrl}
      alt={champion.name}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover object-top rounded-full"
    />
  ) : (
    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-base text-gray-900">
      {initial}
    </div>
  );

  return (
    <div className="relative shrink-0" style={{ width: S, height: S }}>
      {/* Portrait image */}
      {onClick ? (
        <button
          type="button"
          onClick={() => onClick(champion)}
          title={`Preview ${champion.name}`}
          className={`absolute rounded-full overflow-hidden border-2 cursor-pointer transition hover:brightness-110 hover:scale-105 ${colorByRarity(champion.rarity)}`}
          style={{ width: IMG, height: IMG, top: OFF, left: OFF }}
        >
          {portraitContent}
        </button>
      ) : (
        <div
          className={`absolute rounded-full overflow-hidden border-2 ${colorByRarity(champion.rarity)}`}
          style={{ width: IMG, height: IMG, top: OFF, left: OFF }}
        >
          {portraitContent}
        </div>
      )}

      {/* Curved arc text — upper semicircle */}
      {badge && (
        <svg
          className="absolute inset-0 pointer-events-none orbit-cw"
          width={S}
          height={S}
          viewBox={`0 0 ${S} ${S}`}
        >
          <defs>
            <path
              id={arcId}
              d={`M ${CX - R},${CY} A ${R},${R} 0 0,0 ${CX + R},${CY}`}
            />
          </defs>
          <text fontSize="5.8" fill="#16a34a" fontWeight="bold" letterSpacing="1.2">
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              {badge.toUpperCase()}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  );
}

interface QueueItemProps {
  champion: IChampion;
  rank: number;
  teamCount: number;
  onDone: (id: string) => void;
  doneLabel: string;
  isDoing: boolean;
  mode: "books" | "masteries";
  onPreview: (champion: IChampion) => void;
}

function QueueItem({ champion, rank, teamCount, onDone, doneLabel, isDoing, mode, onPreview }: QueueItemProps) {
  // Only show completion badge for the "other" upgrade type
  const crossBadge =
    mode === "books"
      ? champion.has_mastery ? "Mastered ✓" : null
      : champion.is_booked   ? "Booked ✓"   : null;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-sm">
      {/* rank badge */}
      <span className="text-xs font-bold text-gray-300 w-5 shrink-0 text-center">
        {rank}
      </span>

      <ChampionPortrait champion={champion} badge={crossBadge ?? undefined} onClick={onPreview} />

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-semibold text-sm truncate">{champion.name}</p>
        <p className={`text-[10px] font-semibold ${RARITY_TEXT[champion.rarity]}`}>
          {champion.rarity}
        </p>
        {teamCount > 0 && (
          <p className="text-[10px] text-blue-600 font-medium">
            {teamCount} team{teamCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDone(String(champion.id))}
        disabled={isDoing}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-400 text-green-600 hover:bg-green-500 hover:text-white transition cursor-pointer disabled:opacity-40 shrink-0"
      >
        <FaCheckCircle size={11} />
        {doneLabel}
      </button>
    </div>
  );
}

// Leveling isn't a togglable flag like books/masteries — it has to happen
// in-game, so this row's action opens the champion for editing (to update
// the level once it's done) instead of a one-click "mark done".
interface NeedsLevelItemProps {
  champion: IChampion;
  rank: number;
  teamCount: number;
  onEdit: (champion: IChampion) => void;
  onPreview: (champion: IChampion) => void;
}

function NeedsLevelItem({ champion, rank, teamCount, onEdit, onPreview }: NeedsLevelItemProps) {
  const targetLevel = champion.stars * 10;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-sm">
      {/* rank badge */}
      <span className="text-xs font-bold text-gray-300 w-5 shrink-0 text-center">
        {rank}
      </span>

      <ChampionPortrait champion={champion} onClick={onPreview} />

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-semibold text-sm truncate">{champion.name}</p>
        <p className={`text-[10px] font-semibold ${RARITY_TEXT[champion.rarity]}`}>
          {champion.rarity}
        </p>
        {teamCount > 0 && (
          <p className="text-[10px] text-blue-600 font-medium">
            {teamCount} team{teamCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
          <FaLevelUpAlt size={11} /> Lv {champion.level} → {targetLevel}
        </span>
        <button
          type="button"
          onClick={() => onEdit(champion)}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-500 hover:text-white transition cursor-pointer"
        >
          <FaEdit size={11} /> Edit
        </button>
      </div>
    </div>
  );
}

// ── Sectioned queue panel (grouped by rarity) ────────────────────────────────

interface SectionedQueuePanelProps {
  title: string;
  icon: React.ReactNode;
  champions: Array<{ champion: IChampion; teamCount: number }>;
  onDone: (id: string) => void;
  processing: Set<string>;
  mode: "books" | "masteries";
  doneLabel: string;
  emptyMsg: string;
  rarityOrder: ChampionRarity[];
  rarityLabelSuffix: string;
  onPreview: (champion: IChampion) => void;
}

function SectionedQueuePanel({
  title, icon, champions, onDone, processing, mode, doneLabel, emptyMsg, rarityOrder, rarityLabelSuffix, onPreview,
}: SectionedQueuePanelProps) {
  const groups = rarityOrder
    .map((rarity) => ({
      rarity,
      items: champions.filter((item) => item.champion.rarity === rarity),
    }))
    .filter((g) => g.items.length > 0);

  const total = champions.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-600">{icon}</span>
        <h2 className="font-bold text-base">{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {total}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 gap-2">
          <FaCheckCircle size={24} className="text-green-300" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ rarity, items }) => (
            <div key={rarity} className="space-y-2">
              {/* Rarity section header */}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${RARITY_BADGE[rarity] ?? ""}`}>
                  {rarity} {rarityLabelSuffix}
                </span>
                <span className="text-xs text-gray-400">
                  {items.length} champion{items.length !== 1 ? "s" : ""}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
              {/* Champions in this rarity */}
              {items.map(({ champion, teamCount }, i) => (
                <QueueItem
                  key={champion.id}
                  champion={champion}
                  rank={i + 1}
                  teamCount={teamCount}
                  doneLabel={doneLabel}
                  onDone={onDone}
                  isDoing={processing.has(String(champion.id))}
                  mode={mode}
                  onPreview={onPreview}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flat queue panel (no rarity grouping — just an inline rarity breakdown) ──

interface FlatQueuePanelProps {
  title: string;
  icon: React.ReactNode;
  champions: Array<{ champion: IChampion; teamCount: number }>;
  onDone: (id: string) => void;
  processing: Set<string>;
  doneLabel: string;
  emptyMsg: string;
  onPreview: (champion: IChampion) => void;
}

function FlatQueuePanel({
  title, icon, champions, onDone, processing, doneLabel, emptyMsg, onPreview,
}: FlatQueuePanelProps) {
  const total = champions.length;

  const rarityCounts: Partial<Record<ChampionRarity, number>> = {};
  for (const { champion } of champions) {
    rarityCounts[champion.rarity as ChampionRarity] = (rarityCounts[champion.rarity as ChampionRarity] ?? 0) + 1;
  }
  const rarityBreakdown = MASTERY_RARITY_ORDER
    .map((rarity) => ({ rarity, count: rarityCounts[rarity] ?? 0 }))
    .filter((r) => r.count > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-600">{icon}</span>
        <h2 className="font-bold text-base">{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {total}
        </span>
      </div>

      {rarityBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rarityBreakdown.map(({ rarity, count }) => (
            <span
              key={rarity}
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${RARITY_BADGE[rarity] ?? ""}`}
            >
              {rarity} · {count}
            </span>
          ))}
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 gap-2">
          <FaCheckCircle size={24} className="text-green-300" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {champions.map(({ champion, teamCount }, i) => (
            <QueueItem
              key={champion.id}
              champion={champion}
              rank={i + 1}
              teamCount={teamCount}
              doneLabel={doneLabel}
              onDone={onDone}
              isDoing={processing.has(String(champion.id))}
              mode="masteries"
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Needs Level panel (no rarity grouping, edit action instead of a toggle) ──

interface NeedsLevelPanelProps {
  title: string;
  icon: React.ReactNode;
  champions: Array<{ champion: IChampion; teamCount: number }>;
  onEdit: (champion: IChampion) => void;
  onPreview: (champion: IChampion) => void;
  emptyMsg: string;
}

function NeedsLevelPanel({ title, icon, champions, onEdit, onPreview, emptyMsg }: NeedsLevelPanelProps) {
  const total = champions.length;

  const rarityCounts: Partial<Record<ChampionRarity, number>> = {};
  for (const { champion } of champions) {
    rarityCounts[champion.rarity as ChampionRarity] = (rarityCounts[champion.rarity as ChampionRarity] ?? 0) + 1;
  }
  const rarityBreakdown = MASTERY_RARITY_ORDER
    .map((rarity) => ({ rarity, count: rarityCounts[rarity] ?? 0 }))
    .filter((r) => r.count > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-600">{icon}</span>
        <h2 className="font-bold text-base">{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {total}
        </span>
      </div>

      {rarityBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rarityBreakdown.map(({ rarity, count }) => (
            <span
              key={rarity}
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${RARITY_BADGE[rarity] ?? ""}`}
            >
              {rarity} · {count}
            </span>
          ))}
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 gap-2">
          <FaCheckCircle size={24} className="text-green-300" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {champions.map(({ champion, teamCount }, i) => (
            <NeedsLevelItem
              key={champion.id}
              champion={champion}
              rank={i + 1}
              teamCount={teamCount}
              onEdit={onEdit}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PriorityQueue() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [processingBooks, setProcessingBooks] = useState<Set<string>>(new Set());
  const [processingMasteries, setProcessingMasteries] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchChampions();
    const [champs, fetchedTeams] = await Promise.all([
      generateChampions(),
      fetchTeams(),
    ]);
    setChampions(champs);
    setTeams(fetchedTeams);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // champion_id → team count
  const teamCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const team of teams) {
      for (const id of team.champion_ids) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [teams]);

  const ranked = useCallback(
    (list: IChampion[], scoreFn: (c: IChampion, teamCount: number) => number) =>
      [...list]
        .map((c) => ({ champion: c, teamCount: teamCountMap.get(String(c.id)) ?? 0 }))
        .sort((a, b) =>
          scoreFn(b.champion, b.teamCount) - scoreFn(a.champion, a.teamCount),
        ),
    [teamCountMap],
  );

  const needsBooks = useMemo(
    () => ranked(
      champions.filter((c) =>
        c.is_book_needed && !c.is_booked && (teamCountMap.get(String(c.id)) ?? 0) > 0,
      ),
      priorityScore,
    ),
    [champions, ranked, teamCountMap],
  );
  const needsMasteries = useMemo(
    () => ranked(
      champions.filter((c) =>
        c.is_mastery_needed && !c.has_mastery && (teamCountMap.get(String(c.id)) ?? 0) > 0,
      ),
      masteryPriorityScore,
    ),
    [champions, ranked, teamCountMap],
  );
  const needsLevel = useMemo(
    () => ranked(
      champions.filter((c) =>
        (teamCountMap.get(String(c.id)) ?? 0) > 0 &&
        getBuildQuality(c, checkIfChampionIsBuilt(c)) === "needs_level",
      ),
      masteryPriorityScore,
    ),
    [champions, ranked, teamCountMap],
  );

  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewChampion, setPreviewChampion] = useState<IChampion | null>(null);

  const handleEditChampion = (champion: IChampion) => {
    setEditingChampion(champion);
    setShowEditModal(true);
  };
  const handleCloseEditModal = async (shouldReload: boolean) => {
    setShowEditModal(false);
    setEditingChampion(null);
    if (shouldReload) await loadData();
  };

  const markBookDone = async (id: string) => {
    setProcessingBooks((s) => new Set(s).add(id));
    const { error } = await supabase.from("champions").update({ is_booked: true }).eq("id", id);
    if (!error) {
      localStorage.removeItem("supabase_champion_list");
      setChampions((prev) =>
        prev.map((c) => (String(c.id) === id ? { ...c, is_booked: true } : c)),
      );
    }
    setProcessingBooks((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const markMasteryDone = async (id: string) => {
    setProcessingMasteries((s) => new Set(s).add(id));
    const { error } = await supabase.from("champions").update({ has_mastery: true }).eq("id", id);
    if (!error) {
      localStorage.removeItem("supabase_champion_list");
      setChampions((prev) =>
        prev.map((c) => (String(c.id) === id ? { ...c, has_mastery: true } : c)),
      );
    }
    setProcessingMasteries((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  if (loading) return <ArcaneLoader label="Ranking your priorities" />;

  const totalPending = needsBooks.length + needsMasteries.length + needsLevel.length;

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MdOutlineAutoAwesome className="text-amber-500" size={22} />
            Priority Queue
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Books are ranked by team presence and rarity; masteries and levels just by team presence — tick them off as you complete them.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {needsBooks.length > 0 && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 flex items-center gap-1.5">
              <FaBook size={11} /> {needsBooks.length} books pending
            </span>
          )}
          {needsMasteries.length > 0 && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
              <FaShieldAlt size={11} /> {needsMasteries.length} masteries pending
            </span>
          )}
          {needsLevel.length > 0 && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
              <FaLevelUpAlt size={11} /> {needsLevel.length} levels pending
            </span>
          )}
        </div>
      </div>

      {/* ── Three-column layout ── */}
      {/* Each column is sticky + self-start so whichever list is shorter simply
          stays pinned in view once its content ends, instead of leaving a
          blank gap while the taller column keeps scrolling past it. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:sticky lg:top-0 lg:self-start">
          <SectionedQueuePanel
            title="Needs Books"
            icon={<FaBook size={16} />}
            champions={needsBooks}
            onDone={markBookDone}
            processing={processingBooks}
            mode="books"
            doneLabel="Mark Booked"
            emptyMsg="All priority champions are booked!"
            rarityOrder={BOOK_RARITY_ORDER}
            rarityLabelSuffix="Tomes"
            onPreview={setPreviewChampion}
          />
        </div>
        <div className="lg:sticky lg:top-0 lg:self-start">
          <FlatQueuePanel
            title="Needs Masteries"
            icon={<FaShieldAlt size={16} />}
            champions={needsMasteries}
            onDone={markMasteryDone}
            processing={processingMasteries}
            doneLabel="Mark Mastered"
            emptyMsg="All priority champions have masteries!"
            onPreview={setPreviewChampion}
          />
        </div>
        <div className="lg:sticky lg:top-0 lg:self-start">
          <NeedsLevelPanel
            title="Needs Level"
            icon={<FaLevelUpAlt size={16} />}
            champions={needsLevel}
            onEdit={handleEditChampion}
            onPreview={setPreviewChampion}
            emptyMsg="No priority champions need levelling!"
          />
        </div>
      </div>

      {totalPending === 0 && (
        <div className="text-center py-12 rounded-xl bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-800">
          <FaCheckCircle className="text-green-400 mx-auto mb-3" size={36} />
          <p className="font-bold text-green-800 dark:text-green-300 text-lg">All caught up!</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Every champion that needs books, masteries, or levelling is sorted.
          </p>
        </div>
      )}

      {showEditModal && (
        <ChampionModal
          champion={editingChampion ?? undefined}
          onClose={handleCloseEditModal}
        />
      )}

      {previewChampion && (
        <Modal isOpen title="Champion Preview" onClose={() => setPreviewChampion(null)}>
          <ChampionCard champion={previewChampion} />
        </Modal>
      )}
    </div>
  );
}
