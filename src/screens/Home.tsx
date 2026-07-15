import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { fetchTeams } from "../helpers/handleTeams";
import { fetchChampions, generateChampions } from "../helpers/handleChampions";
import { evaluateAccountProgressDetailed } from "../helpers/evaluateAccountProgress";
import { getChampionDataQualityCounts } from "../helpers/championDataQuality";
import { ProgressStage } from "../models/ProgressStage";
import { getAreaCoverageBadge } from "../data/areaRoleRequirements";
import { ALL_AREAS } from "../data/allAreas";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaClipboardCheck,
} from "react-icons/fa";

const ALL_STAGES: ProgressStage[] = [
  ProgressStage.BEGINNING,
  ProgressStage.EARLY_GAME,
  ProgressStage.MID_GAME,
  ProgressStage.LATE_GAME,
  ProgressStage.END_GAME,
];

const STAGE_COLORS: Record<ProgressStage, string> = {
  [ProgressStage.BEGINNING]: "orange",
  [ProgressStage.EARLY_GAME]: "blue",
  [ProgressStage.MID_GAME]: "purple",
  [ProgressStage.LATE_GAME]: "red",
  [ProgressStage.END_GAME]: "yellow",
};

const STAGE_BADGE: Record<string, string> = {
  orange: "bg-orange-500 text-white border-orange-500",
  blue: "bg-blue-600 text-white border-blue-600",
  purple: "bg-purple-600 text-white border-purple-600",
  red: "bg-red-600 text-white border-red-600",
  yellow: "bg-yellow-500 text-black border-yellow-500",
};

const STAGE_CARD: Record<string, string> = {
  orange: "border-orange-400",
  blue: "border-blue-500",
  purple: "border-purple-500",
  red: "border-red-500",
  yellow: "border-yellow-400",
};

const STAGE_BAR: Record<string, string> = {
  orange: "bg-orange-400",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  yellow: "bg-yellow-400",
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      await fetchChampions();
      const [data, champs] = await Promise.all([
        fetchTeams(),
        generateChampions(),
      ]);
      setTeams(data);
      setChampions(champs);
      setLoading(false);
    };
    load();
  }, []);

  const progressData = useMemo(
    () => evaluateAccountProgressDetailed(teams),
    [teams],
  );

  const attentionAreas = useMemo(
    () =>
      ALL_AREAS.map((area) => ({
        ...area,
        badge: getAreaCoverageBadge(area.key, teams, champions),
      })).filter((area) => area.badge?.tone === "warning"),
    [teams, champions],
  );

  const attentionGroups = useMemo(() => {
    const map = new Map<string, typeof attentionAreas>();
    for (const area of attentionAreas) {
      const group = map.get(area.group) ?? [];
      group.push(area);
      map.set(area.group, group);
    }
    return Array.from(map.entries()).map(([group, areas]) => ({ group, areas }));
  }, [attentionAreas]);

  const dataQuality = useMemo(() => getChampionDataQualityCounts(champions), [champions]);
  const dataQualityStats = [
    { key: "default_image", label: "Default Image", count: dataQuality.defaultImage },
    { key: "no_image", label: "No Image", count: dataQuality.noImage },
    { key: "under_roled", label: "Under-Roled", count: dataQuality.underRoled },
    { key: "not_viable", label: "Not Viable", count: dataQuality.notViable },
  ].filter((stat) => stat.count > 0);
  const totalDataIssues = dataQualityStats.reduce((sum, stat) => sum + stat.count, 0);

  if (loading) return <ArcaneLoader label="Loading your progress" />;

  const { currentStage, completed, nextSteps } = progressData;
  const currentStageIndex = ALL_STAGES.indexOf(currentStage);
  const color = STAGE_COLORS[currentStage] ?? "orange";

  const currentCompleted = completed[currentStage] ?? [];
  const currentNext = nextSteps[currentStage] ?? [];
  const totalRules = currentCompleted.length + currentNext.length;
  const completionPct =
    totalRules > 0
      ? Math.round((currentCompleted.length / totalRules) * 100)
      : 100;

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      next.has(stage) ? next.delete(stage) : next.add(stage);
      return next;
    });
  };

  const futureStages = ALL_STAGES.slice(currentStageIndex + 1);

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-5 max-w-4xl mx-auto text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold">Account Progression</h1>

      {/* ── Stage Pipeline ── */}
      <div className="flex flex-wrap items-center gap-1">
        {ALL_STAGES.map((stage, i) => {
          const isPast = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const stageColor = STAGE_COLORS[stage];

          return (
            <span key={stage} className="flex items-center gap-1">
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all
                  ${
                    isPast
                      ? "bg-green-500 text-white border-green-500"
                      : isCurrent
                        ? STAGE_BADGE[stageColor]
                        : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  }`}
              >
                {isPast ? (
                  <FaCheckCircle size={10} />
                ) : !isCurrent ? (
                  <FaLock size={9} />
                ) : null}
                {stage}
              </span>
              {i < ALL_STAGES.length - 1 && (
                <span className="text-gray-300 dark:text-gray-600 text-xs">›</span>
              )}
            </span>
          );
        })}
      </div>

      {/* ── Current Stage Card ── */}
      <div className={`border-2 rounded-xl p-4 ${STAGE_CARD[color]}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">
              Current Stage
            </p>
            <h2 className="text-xl font-bold">{currentStage}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{completionPct}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentCompleted.length}/{totalRules} milestones
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${STAGE_BAR[color]}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* ── Current Stage Milestones ── */}
      <div>
        <h2 className="font-semibold text-base mb-2">
          {currentStage} Milestones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentCompleted.map((desc) => (
            <div
              key={desc}
              className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/40"
            >
              <FaCheckCircle className="text-green-500 shrink-0" size={16} />
              <span className="text-sm text-green-800 dark:text-green-300">{desc}</span>
            </div>
          ))}
          {currentNext.map((desc) => (
            <div
              key={desc}
              className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-red-400 bg-red-50 dark:bg-red-950/40"
            >
              <FaTimesCircle className="text-red-400 shrink-0" size={16} />
              <span className="text-sm text-red-800 dark:text-red-300">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Past Stages (collapsed summary) ── */}
      {currentStageIndex > 0 && (
        <div>
          <h2 className="font-semibold text-base mb-2 text-gray-500">
            Completed Stages
          </h2>
          <div className="space-y-2">
            {ALL_STAGES.slice(0, currentStageIndex).map((stage) => {
              const stageDone = completed[stage] ?? [];
              const isExpanded = expandedStages.has(stage);
              const stageColor = STAGE_COLORS[stage];

              return (
                <div key={stage} className="border rounded-xl overflow-hidden dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => toggleStage(stage)}
                    className="w-full flex justify-between items-center p-3 bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-950/60 transition text-left"
                  >
                    <span className="flex items-center gap-2 font-semibold text-sm text-green-700 dark:text-green-400">
                      <FaCheckCircle size={13} className="text-green-500 shrink-0" />
                      {stage}
                      <span className="text-xs font-normal text-green-500">
                        ({stageDone.length} milestones ✓)
                      </span>
                    </span>
                    {isExpanded ? (
                      <FaChevronUp size={12} className="text-gray-400" />
                    ) : (
                      <FaChevronDown size={12} className="text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t dark:border-gray-700">
                      {stageDone.map((desc) => (
                        <div
                          key={desc}
                          className={`flex items-center gap-2 p-2 rounded border-l-4 bg-green-50 dark:bg-green-950/40
                            ${STAGE_CARD[stageColor] ?? "border-green-400"}`}
                        >
                          <FaCheckCircle className="text-green-500 shrink-0" size={13} />
                          <span className="text-xs text-green-700 dark:text-green-400">{desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Future Stages ── */}
      {futureStages.length > 0 && (
        <div>
          <h2 className="font-semibold text-base mb-2 text-gray-500">
            Upcoming Stages
          </h2>
          <div className="space-y-2">
            {futureStages.map((stage) => {
              const stageNext = nextSteps[stage] ?? [];
              const stageDone = completed[stage] ?? [];
              const isExpanded = expandedStages.has(stage);
              const stageColor = STAGE_COLORS[stage];

              return (
                <div
                  key={stage}
                  className="border rounded-xl overflow-hidden dark:border-gray-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleStage(stage)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition text-left"
                  >
                    <span className="flex items-center gap-2 font-semibold text-sm text-gray-600 dark:text-gray-300">
                      <FaLock size={11} className="text-gray-400" />
                      {stage}
                      <span className="text-xs font-normal text-gray-400">
                        ({stageNext.length} remaining)
                      </span>
                    </span>
                    {isExpanded ? (
                      <FaChevronUp size={12} className="text-gray-400" />
                    ) : (
                      <FaChevronDown size={12} className="text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t dark:border-gray-700">
                      {stageDone.map((desc) => (
                        <div
                          key={desc}
                          className="flex items-center gap-2 p-2 rounded border-l-4 border-green-400 bg-green-50 dark:bg-green-950/40"
                        >
                          <FaCheckCircle
                            className="text-green-500 shrink-0"
                            size={13}
                          />
                          <span className="text-xs text-green-700 dark:text-green-400">{desc}</span>
                        </div>
                      ))}
                      {stageNext.map((desc) => (
                        <div
                          key={desc}
                          className={`flex items-center gap-2 p-2 rounded border-l-4 bg-gray-50 dark:bg-gray-800
                            ${STAGE_CARD[stageColor] ?? "border-gray-300"}`}
                        >
                          <FaLock
                            className="text-gray-400 shrink-0"
                            size={11}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All complete ── */}
      {currentStageIndex === ALL_STAGES.length - 1 && completionPct === 100 && (
        <div className="text-center p-8 rounded-xl bg-yellow-50 border-2 border-yellow-400 dark:bg-yellow-950/40">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-bold text-yellow-800 dark:text-yellow-300 text-lg">
            End Game Complete!
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            You have conquered everything Teleria has to offer.
          </p>
        </div>
      )}

      {/* ── Needs Attention ── */}
      <div className="border-2 border-amber-300 dark:border-amber-800 rounded-xl p-4 bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 mb-3">
          <FaExclamationTriangle className="text-amber-500 shrink-0" size={16} />
          <h2 className="font-bold text-base text-amber-900 dark:text-amber-300">Needs Attention</h2>
          {attentionAreas.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              {attentionAreas.length}
            </span>
          )}
        </div>

        {attentionAreas.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <FaCheckCircle className="text-green-500 shrink-0" size={14} />
            Every team with saved roles covers all its required roles.
          </div>
        ) : (
          <div className="space-y-4">
            {attentionGroups.map(({ group, areas }) => (
              <div key={group}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-500/70 mb-1.5">
                  {group}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {areas.map((area) => (
                    <Link
                      key={area.key}
                      to={`/${area.path}`}
                      className="flex flex-col gap-0.5 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 hover:border-amber-400 hover:shadow-sm transition"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{area.name}</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 truncate">{area.badge?.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Roster Health ── */}
      <div
        className={`border-2 rounded-xl p-4 ${
          totalDataIssues > 0
            ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
            : "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <FaClipboardCheck
            className={totalDataIssues > 0 ? "text-blue-500 shrink-0" : "text-green-500 shrink-0"}
            size={16}
          />
          <h2 className={`font-bold text-base ${totalDataIssues > 0 ? "text-blue-900 dark:text-blue-300" : "text-green-900 dark:text-green-300"}`}>
            Roster Health
          </h2>
          {totalDataIssues > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              {totalDataIssues}
            </span>
          )}
        </div>

        {totalDataIssues === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <FaCheckCircle className="text-green-500 shrink-0" size={14} />
            No data-quality issues found on this account&apos;s champions.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dataQualityStats.map((stat) => (
              <Link
                key={stat.key}
                to={`/dev-champions?filter=${stat.key}`}
                className="flex flex-col gap-0.5 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2 hover:border-blue-400 hover:shadow-sm transition"
              >
                <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{stat.count}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{stat.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
