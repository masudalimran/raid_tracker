import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBook, FaCheckCircle, FaShieldAlt } from "react-icons/fa";
import { MdOutlineAutoAwesome } from "react-icons/md";
import { supabase } from "../lib/supabaseClient";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import { checkIfChampionIsBuilt } from "../helpers/checkIfChampionIsBuilt";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";
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

function priorityScore(
  champion: IChampion,
  teamCount: number,
): number {
  let score = 0;
  score += teamCount * 100;                                       // teams carry the most weight
  score += RARITY_SCORE[champion.rarity] ?? 0;
  if (checkIfChampionIsBuilt(champion)) score += 30;             // built = higher urgency
  score += (champion.role ?? []).filter((r) => HIGH_VALUE_ROLES.includes(r as ChampionRole)).length * 10;
  return score;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOK_RARITY_ORDER = [
  ChampionRarity.MYTHICAL,
  ChampionRarity.LEGENDARY,
  ChampionRarity.EPIC,
  ChampionRarity.RARE,
];

const RARITY_BADGE: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "bg-red-100 text-red-700 border border-red-200",
  [ChampionRarity.LEGENDARY]: "bg-orange-100 text-orange-700 border border-orange-200",
  [ChampionRarity.EPIC]:      "bg-purple-100 text-purple-700 border border-purple-200",
  [ChampionRarity.RARE]:      "bg-blue-100 text-blue-700 border border-blue-200",
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

function ChampionPortrait({ champion, badge }: { champion: IChampion; badge?: string }) {
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
    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-base">
      {initial}
    </div>
  );

  return (
    <div className="relative shrink-0" style={{ width: S, height: S }}>
      {/* Portrait image */}
      <div
        className={`absolute rounded-full overflow-hidden border-2 ${colorByRarity(champion.rarity)}`}
        style={{ width: IMG, height: IMG, top: OFF, left: OFF }}
      >
        {portraitContent}
      </div>

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
}

function QueueItem({ champion, rank, teamCount, onDone, doneLabel, isDoing, mode }: QueueItemProps) {
  // Only show completion badge for the "other" upgrade type
  const crossBadge =
    mode === "books"
      ? champion.has_mastery ? "Mastered ✓" : null
      : champion.is_booked   ? "Booked ✓"   : null;

  return (
    <div className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm">
      {/* rank badge */}
      <span className="text-xs font-bold text-gray-300 w-5 shrink-0 text-center">
        {rank}
      </span>

      <ChampionPortrait champion={champion} badge={crossBadge ?? undefined} />

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

interface QueuePanelProps {
  title: string;
  icon: React.ReactNode;
  champions: Array<{ champion: IChampion; teamCount: number }>;
  doneLabel: string;
  emptyMsg: string;
  onDone: (id: string) => void;
  processing: Set<string>;
  mode: "books" | "masteries";
  sectionLabel?: string;
}

function QueuePanel({
  title, icon, champions, doneLabel, emptyMsg, onDone, processing, mode, sectionLabel,
}: QueuePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-600">{icon}</span>
        <h2 className="font-bold text-base">{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {champions.length}
        </span>
      </div>

      {champions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 text-gray-400 gap-2">
          <FaCheckCircle size={24} className="text-green-300" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Alignment spacer — matches the rarity section header height in the books panel */}
          {sectionLabel && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                {sectionLabel}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          )}
          {champions.map(({ champion, teamCount }, i) => (
            <QueueItem
              key={champion.id}
              champion={champion}
              rank={i + 1}
              teamCount={teamCount}
              doneLabel={doneLabel}
              onDone={onDone}
              isDoing={processing.has(String(champion.id))}
              mode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sectioned books panel (grouped by rarity) ────────────────────────────────

interface SectionedBooksPanelProps {
  champions: Array<{ champion: IChampion; teamCount: number }>;
  onDone: (id: string) => void;
  processing: Set<string>;
}

function SectionedBooksPanel({ champions, onDone, processing }: SectionedBooksPanelProps) {
  const groups = BOOK_RARITY_ORDER
    .map((rarity) => ({
      rarity,
      items: champions.filter((item) => item.champion.rarity === rarity),
    }))
    .filter((g) => g.items.length > 0);

  const total = champions.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-600"><FaBook size={16} /></span>
        <h2 className="font-bold text-base">Needs Books</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {total}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 text-gray-400 gap-2">
          <FaCheckCircle size={24} className="text-green-300" />
          <p className="text-sm">All priority champions are booked!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ rarity, items }) => (
            <div key={rarity} className="space-y-2">
              {/* Rarity section header */}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${RARITY_BADGE[rarity] ?? ""}`}>
                  {rarity} Tomes
                </span>
                <span className="text-xs text-gray-400">
                  {items.length} champion{items.length !== 1 ? "s" : ""}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {/* Champions in this rarity */}
              {items.map(({ champion, teamCount }, i) => (
                <QueueItem
                  key={champion.id}
                  champion={champion}
                  rank={i + 1}
                  teamCount={teamCount}
                  doneLabel="Mark Booked"
                  onDone={onDone}
                  isDoing={processing.has(String(champion.id))}
                  mode="books"
                />
              ))}
            </div>
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
    (list: IChampion[]) =>
      [...list]
        .map((c) => ({ champion: c, teamCount: teamCountMap.get(String(c.id)) ?? 0 }))
        .sort((a, b) =>
          priorityScore(b.champion, b.teamCount) - priorityScore(a.champion, a.teamCount),
        ),
    [teamCountMap],
  );

  const needsBooks = useMemo(
    () => ranked(
      champions.filter((c) =>
        c.is_book_needed && !c.is_booked && (teamCountMap.get(String(c.id)) ?? 0) > 0,
      ),
    ),
    [champions, ranked, teamCountMap],
  );
  const needsMasteries = useMemo(
    () => ranked(
      champions.filter((c) =>
        c.is_mastery_needed && !c.has_mastery && (teamCountMap.get(String(c.id)) ?? 0) > 0,
      ),
    ),
    [champions, ranked, teamCountMap],
  );

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

  if (loading) return <ChampionSkeletonLoader length={6} />;

  const totalPending = needsBooks.length + needsMasteries.length;

  return (
    <div className="overflow-auto h-[92vh] p-4 max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MdOutlineAutoAwesome className="text-amber-500" size={22} />
            Priority Queue
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Champions ranked by team presence and rarity — tick them off as you complete them.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {needsBooks.length > 0 && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
              <FaBook size={11} /> {needsBooks.length} books pending
            </span>
          )}
          {needsMasteries.length > 0 && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <FaShieldAlt size={11} /> {needsMasteries.length} masteries pending
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionedBooksPanel
          champions={needsBooks}
          onDone={markBookDone}
          processing={processingBooks}
        />
        <QueuePanel
          title="Needs Masteries"
          icon={<FaShieldAlt size={16} />}
          champions={needsMasteries}
          doneLabel="Mark Mastered"
          emptyMsg="All priority champions have masteries!"
          onDone={markMasteryDone}
          processing={processingMasteries}
          mode="masteries"
          sectionLabel="All Champions"
        />
      </div>

      {totalPending === 0 && (
        <div className="text-center py-12 rounded-xl bg-green-50 border-2 border-green-300">
          <FaCheckCircle className="text-green-400 mx-auto mb-3" size={36} />
          <p className="font-bold text-green-800 text-lg">All caught up!</p>
          <p className="text-sm text-green-600 mt-1">
            Every champion that needs books or masteries is sorted.
          </p>
        </div>
      )}
    </div>
  );
}
