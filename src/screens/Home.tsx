import { useEffect, useMemo, useState } from "react";
import ChampionSkeletonLoader from "../components/loaders/ChampionSkeletonLoader";
import type ITeam from "../models/ITeam";
import { fetchTeams } from "../helpers/handleTeams";
import { evaluateAccountProgressDetailed } from "../helpers/evaluateAccountProgress";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [showAllRemaining, setShowAllRemaining] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchTeams();
      setTeams(data);
      setLoading(false);
    };
    load();
  }, []);

  const progressData = useMemo(() => {
    const result = evaluateAccountProgressDetailed(teams);
    console.log("Progress evaluation:", result);
    return result;
  }, [teams]);

  if (loading) return <ChampionSkeletonLoader length={1} />;

  const { currentStage, completed, nextSteps } = progressData;

  const remainingStages = Object.entries(nextSteps).filter(
    ([stage, steps]) => steps.length > 0 && stage !== currentStage,
  );

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-4">
      <h1 className="text-2xl font-semibold pb-2">Account Progression</h1>

      <p className="uppercase border-t pt-2">
        Current Progression Stage:{" "}
        <span className="font-extrabold">{currentStage}</span>
      </p>

      {/* Progression Bar */}
      <div className="border-b pb-2 flex flex-wrap items-center gap-2">
        {Object.keys(completed).map((stage, index, arr) => {
          const isCurrent = stage === currentStage;

          return (
            <span key={stage} className="flex items-center gap-1">
              <span
                className={`font-semibold px-2 py-1 rounded ${
                  isCurrent
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {stage}
              </span>
              {index < arr.length - 1 && (
                <span className="text-gray-400">→</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Completed Steps */}
      <div>
        <h2 className="font-semibold text-lg pb-2">Completed Steps</h2>
        {completed[currentStage]?.length ? (
          <ul className="list-disc pl-6 space-y-1">
            {completed[currentStage].map((desc, i) => (
              <li key={i}>{desc}</li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-500">
            No steps completed yet in this stage.
          </p>
        )}
      </div>

      {/* Next Steps */}
      <div>
        <h2 className="font-semibold text-lg pb-2">Next Steps</h2>
        {nextSteps[currentStage]?.length ? (
          <ul className="list-disc pl-6 space-y-1">
            {nextSteps[currentStage].map((desc, i) => (
              <li key={i}>{desc}</li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-500">
            All steps completed in this stage!
          </p>
        )}
      </div>

      {/* Remaining Everything Else */}
      {remainingStages.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllRemaining((prev) => !prev)}
            className="text-blue-600 hover:underline mb-2"
          >
            {showAllRemaining
              ? "Hide Remaining Stages"
              : "Show All Remaining Stages"}
          </button>

          {showAllRemaining &&
            remainingStages.map(([stage, steps]) => (
              <div key={stage} className="mb-2">
                <h3 className="font-semibold">{stage}</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {steps.map((desc, i) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
