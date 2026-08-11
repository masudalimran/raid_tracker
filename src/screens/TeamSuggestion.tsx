import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MdAutoAwesome } from "react-icons/md";
import { FaCheckCircle, FaSave } from "react-icons/fa";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import ChampionCard from "../components/card/ChampionCard";
import Modal from "../components/modals/Modal";
import Tooltip from "../components/utility/Tooltip";
import { generateChampions } from "../helpers/handleChampions";
import { fetchTeams, fetchSingleTeam } from "../helpers/handleTeams";
import { useTeam } from "../hooks/useTeam";
import { suggestTeam } from "../helpers/suggestTeam";
import { getTeamRequirements, checkTeamCoverage } from "../data/areaRoleRequirements";
import { ALL_AREAS } from "../data/allAreas";
import { AREA_ROUTES } from "../components/modals/AreanRoutes";
import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";

// AREA_ROUTES has the per-area team-size cap; ALL_AREAS has the grouped
// display metadata — cross-reference by teamKey/key (the same raw identifier
// under two names) rather than duplicating either list.
const MAX_CHAMPIONS_BY_KEY = new Map(AREA_ROUTES.map((r) => [r.teamKey, r.maxChampions]));
const AREA_GROUPS = Array.from(new Set(ALL_AREAS.map((a) => a.group)));

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function TeamSuggestion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showConfirm, setShowConfirm] = useState(false);
  const { addTeam, updateTeam } = useTeam();

  useEffect(() => {
    const load = async () => {
      const [champs, fetchedTeams] = await Promise.all([generateChampions(), fetchTeams()]);
      setChampions(champs);
      setTeams(fetchedTeams);
      setLoading(false);
    };
    load();
  }, []);

  const areaKey = searchParams.get("area") ?? ALL_AREAS[0].key;
  const area = ALL_AREAS.find((a) => a.key === areaKey) ?? ALL_AREAS[0];

  const setAreaKey = (key: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("area", key);
      return next;
    }, { replace: true });
    setSaveStatus("idle");
  };

  const maxChampions = MAX_CHAMPIONS_BY_KEY.get(area.key) ?? 5;
  const requiredRoles = useMemo(() => getTeamRequirements(area.key), [area.key]);

  const existingTeam = useMemo(
    () => teams.find((t) => t.team_name === area.path),
    [teams, area.path],
  );

  const suggestion = useMemo(
    () => suggestTeam(champions, requiredRoles, maxChampions),
    [champions, requiredRoles, maxChampions],
  );

  const coverage = useMemo(
    () => checkTeamCoverage(requiredRoles, suggestion.map((s) => s.champion)),
    [requiredRoles, suggestion],
  );
  const coveredCount = coverage.filter((c) => c.coveredBy.length > 0).length;

  const handleApply = async () => {
    setSaveStatus("saving");
    const { id: userId } = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
    const current_rsl_account = JSON.parse(
      localStorage.getItem("supabase_rsl_account_list") ?? "[]",
    ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

    if (!current_rsl_account || !userId) {
      setSaveStatus("error");
      return;
    }

    const champion_ids = suggestion.map((s) => String(s.champion.id));

    try {
      const latest = await fetchSingleTeam(area.key);
      if (latest) {
        const res = await updateTeam(latest.id, { champion_ids });
        const stored = JSON.parse(localStorage.getItem("supabase_team_list") || "[]") as ITeam[];
        const updated = stored.map((t) => (t.id === latest.id ? { ...t, ...res } : t));
        localStorage.setItem("supabase_team_list", JSON.stringify(updated));
        setTeams(updated.filter((t) => t.rsl_account_id === current_rsl_account.id));
      } else {
        const res = await addTeam({
          team_name: area.path,
          champion_ids,
          clearing_stage: "Not set",
          notes: "Created from Team Suggestion",
          user_id: userId,
          rsl_account_id: current_rsl_account.id,
        });
        const stored = JSON.parse(localStorage.getItem("supabase_team_list") || "[]") as ITeam[];
        stored.push(res);
        localStorage.setItem("supabase_team_list", JSON.stringify(stored));
        setTeams((prev) => [...prev, res]);
      }
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error applying suggested team:", error);
      setSaveStatus("error");
    }
  };

  if (loading) return <ArcaneLoader label="Scouting your roster" />;

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MdAutoAwesome className="text-amber-500" size={22} />
          Team Suggestion
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Pick an area — we'll suggest the strongest team from your roster based on role coverage and champion power.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={area.key}
          onChange={(e) => setAreaKey(e.target.value)}
          className="basic-select w-64"
        >
          {AREA_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {ALL_AREAS.filter((a) => a.group === group).map((a) => (
                <option key={a.key} value={a.key}>{a.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <Link to={`/${area.path}`} className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
          View this area's team page →
        </Link>

        {existingTeam && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Already has a saved team
          </span>
        )}
      </div>

      {requiredRoles.length === 0 ? (
        <p className="text-xs text-gray-400">
          No specific role requirements are tracked for this area — the strongest available champions are suggested instead.
        </p>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
            {coveredCount}/{requiredRoles.length} roles covered
          </span>
          {coverage.map(({ req, coveredBy }) => (
            <Tooltip
              key={req.label}
              content={coveredBy.length > 0 ? `Covered by ${coveredBy.join(", ")}` : req.tip}
            >
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  coveredBy.length > 0
                    ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-400"
                    : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                {req.label}
              </span>
            </Tooltip>
          ))}
        </div>
      )}

      {suggestion.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Not enough champions in your roster to suggest a team here yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suggestion.map(({ champion, matchedLabels }) => (
              <ChampionCard key={champion.id} champion={champion} matchedRoles={matchedLabels} />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (existingTeam ? setShowConfirm(true) : handleApply())}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <FaSave size={13} />
              {saveStatus === "saving" ? "Applying…" : existingTeam ? "Replace Saved Team" : "Save as Team"}
            </button>
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <FaCheckCircle size={13} /> Saved!
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-500">Couldn't save. Please try again.</span>
            )}
          </div>
        </>
      )}

      <Modal isOpen={showConfirm} title="Replace Saved Team?" onClose={() => setShowConfirm(false)}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {area.name} already has a saved team. Applying this suggestion will replace its champions
          (clearing stage and notes stay as they are).
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 border dark:border-gray-700 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { setShowConfirm(false); handleApply(); }}
            className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition cursor-pointer font-semibold"
          >
            Replace
          </button>
        </div>
      </Modal>
    </div>
  );
}
