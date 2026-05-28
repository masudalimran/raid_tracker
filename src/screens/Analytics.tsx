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
import { getShowSkillsStatus } from "../helpers/getShowSkillsStatus";

const RARITY_ORDER = [
  ChampionRarity.MYTHICAL,
  ChampionRarity.LEGENDARY,
  ChampionRarity.EPIC,
  ChampionRarity.RARE,
  ChampionRarity.UNCOMMON,
  ChampionRarity.COMMON,
];

const RARITY_COLORS: Record<string, string> = {
  [ChampionRarity.MYTHICAL]: "bg-red-500",
  [ChampionRarity.LEGENDARY]: "bg-amber-500",
  [ChampionRarity.EPIC]: "bg-purple-500",
  [ChampionRarity.RARE]: "bg-blue-500",
  [ChampionRarity.UNCOMMON]: "bg-green-500",
  [ChampionRarity.COMMON]: "bg-gray-400",
};

const RARITY_TEXT: Record<string, string> = {
  [ChampionRarity.MYTHICAL]: "text-red-600",
  [ChampionRarity.LEGENDARY]: "text-amber-600",
  [ChampionRarity.EPIC]: "text-purple-600",
  [ChampionRarity.RARE]: "text-blue-600",
  [ChampionRarity.UNCOMMON]: "text-green-600",
  [ChampionRarity.COMMON]: "text-gray-500",
};

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

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);

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

    // Skill data coverage
    const withSkills = champions.filter(
      (c) => c.skills && c.skills.length > 0,
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
      withSkills,
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
      <h1 className="text-xl font-bold">Roster Analytics</h1>

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
        <div className="bg-white border rounded-xl p-4 space-y-3">
          {[
            {
              label: "Built ✓",
              count: stats.built,
              colorClass: "bg-green-500",
              textClass: "text-green-600",
            },
            {
              label: "Needs Improvement",
              count: stats.improving,
              colorClass: "bg-amber-400",
              textClass: "text-amber-600",
            },
            {
              label: "Not Built",
              count: stats.notBuilt,
              colorClass: "bg-red-400",
              textClass: "text-red-500",
            },
            {
              label: "Untouched",
              count: stats.untouched,
              colorClass: "bg-gray-300",
              textClass: "text-gray-400",
            },
          ].map(({ label, count, colorClass, textClass }) => (
            <BarRow
              key={label}
              label={label}
              count={count}
              max={stats.total}
              colorClass={colorClass}
              textClass={textClass}
            />
          ))}
        </div>
      </section>

      {/* ── By Rarity ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          By Rarity
        </h2>
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
      </section>

      {/* ── Role distribution ── */}
      {stats.topRoles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Role Distribution
          </h2>
          <div className="bg-white border rounded-xl p-4 space-y-3">
            {stats.topRoles.map(([role, count]) => (
              <BarRow
                key={role}
                label={role}
                count={count}
                max={stats.total}
                colorClass="bg-violet-400"
                textClass="text-violet-700"
              />
            ))}
          </div>
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

      {/* ── Data health — only shown when skill tracking is enabled ── */}
      {getShowSkillsStatus() && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Data Health
          </h2>
          <div className="bg-white border rounded-xl p-4 space-y-3">
            <BarRow
              label="Skill Data"
              count={stats.withSkills}
              max={stats.total}
              colorClass={
                stats.withSkills / stats.total >= 0.5
                  ? "bg-green-400"
                  : "bg-amber-400"
              }
              textClass="text-gray-600"
            />
            <p className="text-xs text-gray-400">
              Champions with skill data get richer role coverage analysis on
              area team screens.
              {stats.withSkills < stats.total && (
                <span className="text-amber-600">
                  {" "}
                  {stats.total - stats.withSkills} champions have no skills
                  entered yet.
                </span>
              )}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
