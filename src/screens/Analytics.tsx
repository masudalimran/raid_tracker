import { useEffect, useMemo, useState } from "react";
import { generateChampions } from "../helpers/handleChampions";
import { fetchTeams } from "../helpers/handleTeams";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionRole } from "../models/ChampionRole";
import { checkIfChampionIsBuilt } from "../helpers/checkIfChampionIsBuilt";
import { needsImprovement } from "../helpers/getChampionBuildQuality";
// import { getShowSkillsStatus } from "../helpers/getShowSkillsStatus"; // skills hidden

const RARITY_ORDER = [
  ChampionRarity.MYTHICAL,
  ChampionRarity.LEGENDARY,
  ChampionRarity.EPIC,
  ChampionRarity.RARE,
  ChampionRarity.UNCOMMON,
  ChampionRarity.COMMON,
];

// Tailwind classes for bar chart
const RARITY_COLORS: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "bg-red-500",
  [ChampionRarity.LEGENDARY]: "bg-amber-500",
  [ChampionRarity.EPIC]:      "bg-purple-500",
  [ChampionRarity.RARE]:      "bg-blue-500",
  [ChampionRarity.UNCOMMON]:  "bg-green-500",
  [ChampionRarity.COMMON]:    "bg-gray-400",
};

const RARITY_TEXT: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "text-red-600",
  [ChampionRarity.LEGENDARY]: "text-amber-600",
  [ChampionRarity.EPIC]:      "text-purple-600",
  [ChampionRarity.RARE]:      "text-blue-600",
  [ChampionRarity.UNCOMMON]:  "text-green-600",
  [ChampionRarity.COMMON]:    "text-gray-500",
};

// Hex colors for SVG (Tailwind doesn't work inside SVG attributes)
const RARITY_HEX: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "#ef4444",
  [ChampionRarity.LEGENDARY]: "#f97316",
  [ChampionRarity.EPIC]:      "#a855f7",
  [ChampionRarity.RARE]:      "#3b82f6",
  [ChampionRarity.UNCOMMON]:  "#22c55e",
  [ChampionRarity.COMMON]:    "#9ca3af",
};

const BUILD_STATUS_HEX: Record<string, string> = {
  "Built ✓":           "#22c55e",
  "Needs Improvement": "#fbbf24",
  "Not Built":         "#f87171",
  "Untouched":         "#d1d5db",
};

// Cycling palette for role distribution
const ROLE_PIE_PALETTE = [
  "#8b5cf6","#06b6d4","#f59e0b","#10b981",
  "#f43f5e","#3b82f6","#84cc16","#ec4899",
  "#14b8a6","#f97316","#6366f1","#a3e635",
];

const ALL_ROLES = Object.values(ChampionRole).filter(
  (r) =>
    ![
      "Campaign Farmer",
      "Demon Lord",
      "Hydra",
      "Chimera",
      "Doom Tower",
    ].includes(r),
);

function StatCard({
  label,
  value,
  sub,
  color = "text-gray-800",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  colorClass,
  textClass,
}: {
  label: string;
  count: number;
  max: number;
  colorClass: string;
  textClass: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold w-24 shrink-0 ${textClass}`}>
        {label}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right shrink-0 text-nowrap">
        {count} <span className="text-gray-300">({pct}%)</span>
      </span>
    </div>
  );
}

// ── SVG Donut chart ───────────────────────────────────────────────────────────

interface PieSegment { label: string; count: number; color: string }

const DONUT_R = 52;
const DONUT_CX = 70;
const DONUT_CY = 70;
const DONUT_C = 2 * Math.PI * DONUT_R;

function DonutChart({ segments }: { segments: PieSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  let cumulative = 0;
  const active = segments.filter((s) => s.count > 0);

  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0">
      {active.length === 0 ? (
        <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R} fill="none" stroke="#f3f4f6" strokeWidth="18" />
      ) : (
        active.map((seg, i) => {
          const len = (seg.count / total) * DONUT_C;
          const offset = -cumulative;
          cumulative += len;
          return (
            <circle
              key={i}
              cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${DONUT_C - len}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
            />
          );
        })
      )}
      <text x={DONUT_CX} y={DONUT_CY - 5} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111827">
        {total}
      </text>
      <text x={DONUT_CX} y={DONUT_CY + 13} textAnchor="middle" fontSize="10" fill="#9ca3af">
        total
      </text>
    </svg>
  );
}

function PieChartBlock({ segments }: { segments: PieSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  return (
    <div className="bg-white border rounded-xl p-4 flex items-center gap-5 flex-wrap">
      <DonutChart segments={segments} />
      <div className="flex-1 min-w-0 space-y-2">
        {segments.filter((s) => s.count > 0).map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-gray-600 flex-1 truncate">{seg.label}</span>
              <span className="text-xs font-semibold text-gray-800">{seg.count}</span>
              <span className="text-[10px] text-gray-400 w-8 text-right">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [showPie, setShowPie] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [champs, fetchedTeams] = await Promise.all([
        generateChampions(),
        fetchTeams(),
      ]);
      setChampions(champs);
      setTeams(fetchedTeams);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    if (!champions.length) return null;

    const total = champions.length;
    const teamChampionIds = new Set(teams.flatMap((t) => t.champion_ids));
    const inUse = champions.filter((c) =>
      teamChampionIds.has(String(c.id)),
    ).length;
    const built = champions.filter((c) => checkIfChampionIsBuilt(c)).length;
    const untouched = champions.filter((c) => c.spd <= 120).length;

    // By rarity
    const byRarity = Object.fromEntries(
      RARITY_ORDER.map((r) => [
        r,
        champions.filter((c) => c.rarity === r).length,
      ]),
    );

    // By role (a champion can have multiple roles)
    const byRole: Record<string, number> = {};
    for (const role of ALL_ROLES) {
      byRole[role] = champions.filter((c) => c.role?.includes(role)).length;
    }
    const topRoles = Object.entries(byRole)
      .filter(([, n]) => n > 0)
      .sort(([, a], [, b]) => b - a);

    // By faction
    const byFaction: Record<string, number> = {};
    for (const c of champions) {
      byFaction[c.faction] = (byFaction[c.faction] ?? 0) + 1;
    }
    const topFactions = Object.entries(byFaction).sort(([, a], [, b]) => b - a);

    // Build status — using the shared threshold helper (>2 stats below threshold)
    const improving = champions.filter(
      (c) => checkIfChampionIsBuilt(c) && needsImprovement(c),
    ).length;
    const notBuilt = champions.filter(
      (c) => !checkIfChampionIsBuilt(c) && c.spd > 120,
    ).length;

    return {
      total,
      inUse,
      built,
      untouched,
      byRarity,
      byRole,
      topRoles,
      byFaction,
      topFactions,
      improving,
      notBuilt,
    };
  }, [champions, teams]);

  if (loading) return <ChampionSkeletonLoader length={6} />;
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[92vh] text-gray-400 text-sm">
        No champions found. Add some to see analytics.
      </div>
    );
  }

  return (
    <div className="overflow-scroll h-[92vh] p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Roster Analytics</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setShowPie(false)}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${!showPie ? "bg-white shadow text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
          >
            Bar
          </button>
          <button
            type="button"
            onClick={() => setShowPie(true)}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${showPie ? "bg-white shadow text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
          >
            Pie
          </button>
        </div>
      </div>

      {/* ── Overview ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} color="text-gray-800" />
          <StatCard
            label="Built"
            value={stats.built}
            sub={`${Math.round((stats.built / stats.total) * 100)}% of roster`}
            color="text-green-600"
          />
          <StatCard
            label="In Teams"
            value={stats.inUse}
            sub={`${Math.round((stats.inUse / stats.total) * 100)}% of roster`}
            color="text-blue-600"
          />
          <StatCard
            label="Untouched"
            value={stats.untouched}
            sub={`${Math.round((stats.untouched / stats.total) * 100)}% of roster`}
            color="text-gray-400"
          />
        </div>
      </section>

      {/* ── Build status ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Build Status
        </h2>
        {showPie ? (
          <PieChartBlock
            segments={[
              { label: "Built ✓",           count: stats.built,       color: BUILD_STATUS_HEX["Built ✓"] },
              { label: "Needs Improvement",  count: stats.improving,   color: BUILD_STATUS_HEX["Needs Improvement"] },
              { label: "Not Built",          count: stats.notBuilt,    color: BUILD_STATUS_HEX["Not Built"] },
              { label: "Untouched",          count: stats.untouched,   color: BUILD_STATUS_HEX["Untouched"] },
            ]}
          />
        ) : (
          <div className="bg-white border rounded-xl p-4 space-y-3">
            {[
              { label: "Built ✓",           count: stats.built,     colorClass: "bg-green-500", textClass: "text-green-600" },
              { label: "Needs Improvement",  count: stats.improving, colorClass: "bg-amber-400", textClass: "text-amber-600" },
              { label: "Not Built",          count: stats.notBuilt,  colorClass: "bg-red-400",   textClass: "text-red-500" },
              { label: "Untouched",          count: stats.untouched, colorClass: "bg-gray-300",  textClass: "text-gray-400" },
            ].map(({ label, count, colorClass, textClass }) => (
              <BarRow key={label} label={label} count={count} max={stats.total} colorClass={colorClass} textClass={textClass} />
            ))}
          </div>
        )}
      </section>

      {/* ── By Rarity ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          By Rarity
        </h2>
        {showPie ? (
          <PieChartBlock
            segments={RARITY_ORDER.map((rarity) => ({
              label: rarity,
              count: stats.byRarity[rarity] ?? 0,
              color: RARITY_HEX[rarity],
            }))}
          />
        ) : (
          <div className="bg-white border rounded-xl p-4 space-y-3">
            {RARITY_ORDER.map((rarity) => (
              <BarRow
                key={rarity}
                label={rarity}
                count={stats.byRarity[rarity] ?? 0}
                max={stats.total}
                colorClass={RARITY_COLORS[rarity]}
                textClass={RARITY_TEXT[rarity]}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Role distribution ── */}
      {stats.topRoles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Role Distribution
          </h2>
          {showPie ? (
            <PieChartBlock
              segments={stats.topRoles.map(([role, count], i) => ({
                label: role,
                count,
                color: ROLE_PIE_PALETTE[i % ROLE_PIE_PALETTE.length],
              }))}
            />
          ) : (
            <div className="bg-white border rounded-xl p-4 space-y-3">
              {stats.topRoles.map(([role, count]) => (
                <BarRow key={role} label={role} count={count} max={stats.total} colorClass="bg-violet-400" textClass="text-violet-700" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Faction coverage ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Faction Coverage — {stats.topFactions.length} factions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {stats.topFactions.map(([faction, count]) => (
            <div
              key={faction}
              className="bg-white border rounded-xl px-3 py-2.5 flex items-center justify-between shadow-sm"
            >
              <span className="text-xs text-gray-600 truncate">{faction}</span>
              <span className="text-xs font-bold text-gray-800 shrink-0 ml-2">
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Data Health section removed — skill tracking hidden */}
    </div>
  );
}
