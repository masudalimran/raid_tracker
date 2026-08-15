import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TbRefreshDot } from "react-icons/tb";
import { CiSearch } from "react-icons/ci";
import { FaFileExport, FaFileImport, FaMagic } from "react-icons/fa";
import { MdArrowBack, MdAutoFixHigh, MdClose, MdImportExport } from "react-icons/md";
import ChampionCard from "../components/card/ChampionCard";
import ChampionModal from "../components/modals/ChampionModal";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import EmptyChampionList from "../components/empty/EmptyChampionList";
import Modal from "../components/modals/Modal";
import DefaultChampionObject from "../components/forms/defaultChampionObject";
import {
  fetchChampions,
  generateChampions,
  computeChampionReconciliationPlan,
  applyChampionReconciliationPlan,
} from "../helpers/handleChampions";
import {
  buildChampionImportPlan,
  buildChampionResearchPrompt,
  buildChampionRoleImportPlan,
  buildChampionRoleResearchPrompt,
  parseChampionImportPayload,
  type ChampionImportRow,
  type ChampionRoleImportRow,
} from "../helpers/championImportExport";
import { getNsfwStatus } from "../helpers/getNsfwStatus";
import { MIN_VIABLE_ROLES as MIN_ROLES } from "../helpers/championDataQuality";
import { getCurrentlyInUseChampions } from "../helpers/getChampionsInUse";
import { ChampionRole } from "../models/ChampionRole";
import type IChampion from "../models/IChampion";

type DevFilterMode = "default_image" | "no_image" | "under_roled" | "not_viable" | "no_relic" | "no_blessing";

const DEV_FILTER_MODES: DevFilterMode[] = ["default_image", "no_image", "under_roled", "not_viable", "no_relic", "no_blessing"];
const isDevFilterMode = (value: string | null): value is DevFilterMode =>
  !!value && (DEV_FILTER_MODES as string[]).includes(value);

const FILTER_LABELS: Record<DevFilterMode, { title: string; subtitle: (n: number) => string }> = {
  default_image: {
    title: "Champions With Default Image",
    subtitle: (n) => `${n} champion${n !== 1 ? "s" : ""} still using the default placeholder image.`,
  },
  no_image: {
    title: "Champions With No Image",
    subtitle: (n) => `${n} champion${n !== 1 ? "s" : ""} with no image URL set at all.`,
  },
  under_roled: {
    title: "Under-Roled Champions",
    subtitle: (n) =>
      `${n} champion${n !== 1 ? "s" : ""} tagged with fewer than ${MIN_ROLES} roles (Not Viable champions excluded).`,
  },
  not_viable: {
    title: "Not Viable Champions",
    subtitle: (n) => `${n} champion${n !== 1 ? "s" : ""} tagged as Not Viable.`,
  },
  no_relic: {
    title: "No Equipped Relic",
    subtitle: (n) =>
      `${n} champion${n !== 1 ? "s" : ""} used in at least 1 team but with no relic equipped (Not Viable champions excluded).`,
  },
  no_blessing: {
    title: "No Equipped Blessing",
    subtitle: (n) =>
      `${n} awakened champion${n !== 1 ? "s" : ""} (1+ Awakened Star) used in at least 1 team but with no blessing equipped (Not Viable champions excluded).`,
  },
};

// Dev-only, unlisted page (no sidebar link — reach it by typing /dev-champions
// directly) for finding champions that need data cleanup: missing images,
// still on the default placeholder image, or under-roled. Deliberately
// stripped of Filter, Bulk Edit, and Import/Export — none of that applies here.
export default function DevChampions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [championList, setChampionList] = useState<IChampion[]>([]);
  const [allAccountsChampionList, setAllAccountsChampionList] = useState<IChampion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const filterMode: DevFilterMode = isDevFilterMode(searchParams.get("filter"))
    ? (searchParams.get("filter") as DevFilterMode)
    : "default_image";
  const setFilterMode = (mode: DevFilterMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("filter", mode);
      return next;
    }, { replace: true });
  };
  const [nsfw, setNsfw] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<IChampion | null>(null);

  const [showReconcileConfirm, setShowReconcileConfirm] = useState(false);
  const [reconcileStatus, setReconcileStatus] = useState<"idle" | "applying" | "error">("idle");

  // Research import/export — export the names needing data, hand them to an
  // AI to research, then paste the structured response back in.
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "applying" | "error">("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ updated: number; skipped: string[] } | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadChampions = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) localStorage.removeItem("supabase_champion_list");
    try {
      const all = await fetchChampions();
      setAllAccountsChampionList(all);
      const generated = await generateChampions();
      setChampionList(generated || []);
    } catch (error) {
      console.error("Error loading champions:", error);
      setChampionList([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadChampions(); }, [loadChampions]);
  useEffect(() => { setNsfw(getNsfwStatus()); }, []);

  const flaggedChampions = useMemo(() => {
    switch (filterMode) {
      case "no_image":
        return championList.filter((c) => !c.imgUrl);
      case "under_roled":
        return championList.filter(
          (c) => (c.role?.length ?? 0) < MIN_ROLES && !c.role?.includes(ChampionRole.NOT_VIABLE),
        );
      case "not_viable":
        return championList.filter((c) => c.role?.includes(ChampionRole.NOT_VIABLE));
      case "no_relic":
        return getCurrentlyInUseChampions(championList).filter(
          (c) => !c.relic && !c.role?.includes(ChampionRole.NOT_VIABLE),
        );
      case "no_blessing":
        return getCurrentlyInUseChampions(championList).filter(
          (c) => c.awaken_stars >= 1 && !c.blessing && !c.role?.includes(ChampionRole.NOT_VIABLE),
        );
      case "default_image":
      default:
        return championList.filter((c) => c.imgUrl === DefaultChampionObject.imgUrl);
    }
  }, [championList, filterMode]);

  const filteredChampions = useMemo(() => {
    const list = searchText
      ? flaggedChampions.filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase()))
      : flaggedChampions;
    if (filterMode === "under_roled") return list;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [flaggedChampions, searchText, filterMode]);

  // Cross-account sync plan: fills in image/identity/URL/faction gaps on
  // default-image duplicates using whichever same-named champion (in any RSL
  // account) already has real data set.
  const reconcilePlan = useMemo(
    () => computeChampionReconciliationPlan(allAccountsChampionList),
    [allAccountsChampionList],
  );
  const reconcileAffectedNames = useMemo(
    () => new Set(reconcilePlan.map((entry) => entry.name)).size,
    [reconcilePlan],
  );

  const handleReconcileConfirm = async () => {
    setReconcileStatus("applying");
    const result = await applyChampionReconciliationPlan(reconcilePlan);
    if (!result.success) {
      setReconcileStatus("error");
      return;
    }
    setReconcileStatus("idle");
    setShowReconcileConfirm(false);
    await loadChampions();
  };

  const handleExportNames = () => {
    setShowToolsMenu(false);
    const blob = new Blob([filteredChampions.map((c) => c.name).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filterMode}_champions_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRoleImportMode = filterMode === "under_roled";

  const handleCopyPrompt = async () => {
    const names = filteredChampions.map((c) => c.name);
    const prompt = isRoleImportMode
      ? buildChampionRoleResearchPrompt(names)
      : buildChampionResearchPrompt(names);
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const openImportModal = () => {
    setShowToolsMenu(false);
    setImportText("");
    setImportError(null);
    setImportResult(null);
    setShowImportModal(true);
  };

  const handleApplyImport = async () => {
    setImportStatus("applying");
    setImportError(null);
    try {
      const { plan, matchedNames, unmatchedNames } = isRoleImportMode
        ? buildChampionRoleImportPlan(
            parseChampionImportPayload<ChampionRoleImportRow>(importText),
            championList,
          )
        : buildChampionImportPlan(
            parseChampionImportPayload<ChampionImportRow>(importText),
            championList,
          );

      if (plan.length === 0) {
        setImportError("No matching champions with usable data found in the pasted JSON.");
        setImportStatus("idle");
        return;
      }

      const result = await applyChampionReconciliationPlan(plan);
      if (!result.success) {
        setImportError(result.error ?? "Failed to save imported data.");
        setImportStatus("idle");
        return;
      }

      setImportResult({ updated: matchedNames.length, skipped: unmatchedNames });
      setImportStatus("idle");
      await loadChampions();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not parse the pasted data as JSON.",
      );
      setImportStatus("idle");
    }
  };

  const handleEdit = (champion: IChampion) => {
    setEditingChampion(champion);
    setShowModal(true);
  };

  const handleCloseModal = async (shouldReload: boolean) => {
    setShowModal(false);
    setEditingChampion(null);
    if (shouldReload) await loadChampions();
  };

  if (loading) return <ArcaneLoader label="Scanning your roster" />;

  const { title, subtitle } = FILTER_LABELS[filterMode];

  return (
    <div className="flex flex-col h-full">
      <div className="page-header flex-col md:flex-row">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle(flaggedChampions.length)}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as DevFilterMode)}
            className="basic-select w-auto"
          >
            <option value="default_image">Default image</option>
            <option value="no_image">No image</option>
            <option value="under_roled">Under-roled (&lt; {MIN_ROLES})</option>
            <option value="not_viable">Not Viable</option>
            <option value="no_relic">No Equipped Relic</option>
            <option value="no_blessing">No Equipped Blessing</option>
          </select>

          <div className="relative">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search…"
              className="basic-input w-36 sm:w-48 pr-8"
            />
            {searchText ? (
              <button
                type="button"
                title="Clear search"
                onClick={() => setSearchText("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <MdClose size={14} />
              </button>
            ) : (
              <CiSearch
                size={18}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            )}
          </div>
          {filterMode === "default_image" && reconcilePlan.length > 0 && (
            <button
              type="button"
              title="Reduce Default — fill in image/identity data from other accounts"
              onClick={() => setShowReconcileConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
            >
              <MdAutoFixHigh size={20} />
            </button>
          )}
          {(filterMode === "default_image" || filterMode === "no_image" || filterMode === "under_roled") && (
            <div ref={toolsMenuRef} className="relative">
              <button
                type="button"
                title="Research names, export, or import champion data"
                onClick={() => setShowToolsMenu((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <MdImportExport size={22} />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={handleExportNames}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-400 transition cursor-pointer"
                  >
                    <FaFileExport size={12} /> Export Names ({filteredChampions.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-400 transition cursor-pointer border-t border-gray-100 dark:border-gray-700"
                  >
                    <FaMagic size={12} /> {promptCopied ? "Copied!" : isRoleImportMode ? "Copy AI Role Prompt" : "Copy AI Research Prompt"}
                  </button>
                  <button
                    type="button"
                    onClick={openImportModal}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 transition cursor-pointer border-t border-gray-100 dark:border-gray-700"
                  >
                    <FaFileImport size={12} /> {isRoleImportMode ? "Import Roles" : "Import Data"}
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            title="Refresh"
            onClick={() => loadChampions(true)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <TbRefreshDot size={22} />
          </button>
          <button
            type="button"
            title="Back to Champions"
            onClick={() => navigate("/champions")}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            <MdArrowBack size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredChampions.length === 0 ? (
            <EmptyChampionList />
          ) : (
            filteredChampions.map((champion) => (
              <ChampionCard
                key={champion.id}
                champion={champion}
                nsfw={nsfw}
                onEdit={handleEdit}
                onDelete={() => handleCloseModal(true)}
              />
            ))
          )}
        </div>
      </div>

      {showModal && (
        <ChampionModal
          champion={editingChampion ?? undefined}
          onClose={handleCloseModal}
        />
      )}

      <Modal
        isOpen={showReconcileConfirm}
        title="Reduce Default"
        onClose={() => setShowReconcileConfirm(false)}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Across all your RSL accounts, <span className="font-semibold">{reconcileAffectedNames}</span> champion name{reconcileAffectedNames === 1 ? "" : "s"} {reconcileAffectedNames === 1 ? "has" : "have"} copies with mismatched data — one copy with a real image/champion URL/faction while others are still on the default, or one copy with more roles tagged than another. This will copy image, champion URL, faction, affinity, and type from whichever copy has the real image, and roles from whichever copy has the most roles tagged, onto the <span className="font-semibold">{reconcilePlan.length}</span> less-complete cop{reconcilePlan.length === 1 ? "y" : "ies"} — the source copies are never modified.
        </p>
        {reconcileStatus === "error" && (
          <p className="text-sm text-red-500 mb-3">Failed to sync champion data. Please try again.</p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setShowReconcileConfirm(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReconcileConfirm}
            disabled={reconcileStatus === "applying"}
            className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition cursor-pointer font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reconcileStatus === "applying" ? "Syncing…" : "Sync Data"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        title={isRoleImportMode ? "Import Champion Roles" : "Import Champion Data"}
        onClose={() => setShowImportModal(false)}
        maxWidthClass="max-w-2xl"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {isRoleImportMode
            ? "Paste the JSON array an AI (e.g. Gemini) returned after tagging roles for the exported champion names. Matching is by exact champion name — recognized roles are merged into whatever roles a champion already has (nothing is removed)."
            : "Paste the JSON array an AI (e.g. Gemini) returned after researching the exported champion names. Matching is by exact champion name — only recognized rarity/faction/affinity/type values and non-empty URLs are applied."}
        </p>

        <button
          type="button"
          onClick={handleCopyPrompt}
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 border border-purple-200 rounded-full px-3 py-1 bg-purple-50 hover:bg-purple-100 transition cursor-pointer mb-3"
        >
          <FaMagic size={11} /> {promptCopied ? "Copied!" : isRoleImportMode ? "Copy AI Role Prompt" : "Copy AI Research Prompt"}
        </button>

        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={
            isRoleImportMode
              ? '[{"name": "Kael", "roles": ["Nuker", "Boss Killer", "Arena"]}]'
              : '[{"name": "Kael", "rarity": "Legendary", "faction": "High Elves", "affinity": "Force", "type": "Attack", "championUrl": "https://hellhades.com/raid/champions/kael/"}]'
          }
          rows={10}
          className="input font-mono text-xs"
        />

        {importError && (
          <p className="text-sm text-red-500 mb-2">{importError}</p>
        )}

        {importResult && (
          <div className="text-sm mb-2 space-y-1">
            <p className="text-green-600 font-medium">
              Updated {importResult.updated} champion{importResult.updated === 1 ? "" : "s"}.
            </p>
            {importResult.skipped.length > 0 && (
              <p className="text-amber-600">
                Skipped {importResult.skipped.length}: {importResult.skipped.join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => setShowImportModal(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleApplyImport}
            disabled={importStatus === "applying" || !importText.trim()}
            className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition cursor-pointer font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {importStatus === "applying" ? "Importing…" : "Import"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
