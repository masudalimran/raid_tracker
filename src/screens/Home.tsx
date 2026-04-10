import { useEffect, useMemo, useState } from "react";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";
import type ITeam from "../models/ITeam";
import { fetchTeams } from "../helpers/handleTeams";
import { evaluateAccountProgressDetailed } from "../helpers/evaluateAccountProgress";
import { ProgressStage } from "../models/ProgressStage";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaChevronDown,
  FaChevronUp,
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
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const data = await fetchTeams();
      setTeams(data);
      setLoading(false);
    };
    load();
  }, []);

  const progressData = useMemo(
    () => evaluateAccountProgressDetailed(teams),
    [teams],
  );

  if (loading) return <ChampionSkeletonLoader length={1} />;

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
    <div className="overflow-auto h-[92vh] p-4 space-y-5 max-w-4xl mx-auto">
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
                        : "bg-gray-100 text-gray-400 border-gray-200"
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
                <span className="text-gray-300 text-xs">›</span>
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
            <p className="text-xs text-gray-500">
              {currentCompleted.length}/{totalRules} milestones
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
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
              className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-green-500 bg-green-50"
            >
              <FaCheckCircle className="text-green-500 shrink-0" size={16} />
              <span className="text-sm text-green-800">{desc}</span>
            </div>
          ))}
          {currentNext.map((desc) => (
            <div
              key={desc}
              className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-red-400 bg-red-50"
            >
              <FaTimesCircle className="text-red-400 shrink-0" size={16} />
              <span className="text-sm text-red-800">{desc}</span>
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
            {ALL_STAGES.slice(0, currentStageIndex).map((stage) => (
              <div
                key={stage}
                className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200"
              >
                <FaCheckCircle className="text-green-500 shrink-0" />
                <span className="text-sm font-medium text-green-800">
                  {stage}
                </span>
                <span className="ml-auto text-xs text-green-600">
                  {completed[stage]?.length ?? 0} milestones ✓
                </span>
              </div>
            ))}
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
                  className="border rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleStage(stage)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                  >
                    <span className="flex items-center gap-2 font-semibold text-sm text-gray-600">
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
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t">
                      {stageDone.map((desc) => (
                        <div
                          key={desc}
                          className="flex items-center gap-2 p-2 rounded border-l-4 border-green-400 bg-green-50"
                        >
                          <FaCheckCircle
                            className="text-green-500 shrink-0"
                            size={13}
                          />
                          <span className="text-xs text-green-700">{desc}</span>
                        </div>
                      ))}
                      {stageNext.map((desc) => (
                        <div
                          key={desc}
                          className={`flex items-center gap-2 p-2 rounded border-l-4 bg-gray-50
                            ${STAGE_CARD[stageColor] ?? "border-gray-300"}`}
                        >
                          <FaLock
                            className="text-gray-400 shrink-0"
                            size={11}
                          />
                          <span className="text-xs text-gray-600">{desc}</span>
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
        <div className="text-center p-8 rounded-xl bg-yellow-50 border-2 border-yellow-400">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-bold text-yellow-800 text-lg">
            End Game Complete!
          </p>
          <p className="text-sm text-yellow-600">
            You have conquered everything Teleria has to offer.
          </p>
        </div>
      )}
    </div>
  );
}
