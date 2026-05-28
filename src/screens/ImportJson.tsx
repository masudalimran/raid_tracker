import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { parseImportJson } from "../helpers/parseImportJson";
import { mapRtkPayload } from "../helpers/mapRtkData";
import type IChampion from "../models/IChampion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileUpload,
  FaSync,
} from "react-icons/fa";
import { MdOutlineUploadFile } from "react-icons/md";

type Stage = "idle" | "preview" | "importing" | "done" | "error";

interface PreviewData {
  heroCount: number;
  artifactCount: number;
  hasStats: boolean;
  warnings: string[];
  parsedData: ReturnType<typeof parseImportJson>;
}

interface ImportResult {
  inserted: number;
  updated: number;
  gearItems: number;
  skipped: number;
}

export default function ImportJson() {
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const auth = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
  const userId: string = auth?.user?.id ?? "";
  const rslAccounts: Array<{ id: string; is_currently_active: boolean }> =
    JSON.parse(localStorage.getItem("supabase_rsl_account_list") ?? "[]");
  const activeRslAccount = rslAccounts.find((a) => a.is_currently_active);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("Please upload a .json file.");
      setStage("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const parsed = parseImportJson(json);
        setPreview({
          heroCount:     parsed.heroes.length,
          artifactCount: parsed.artifacts.length,
          hasStats:      parsed.hasStats,
          warnings:      parsed.warnings,
          parsedData:    parsed,
        });
        setStage("preview");
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file.");
        setStage("error");
      }
    };
    reader.readAsText(file);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!preview || !userId || !activeRslAccount) return;
    setStage("importing");
    setLog([]);
    setResult(null);

    try {
      addLog("Mapping heroes and gear…");
      const { champions: mapped, gearByChampionName } = mapRtkPayload(
        preview.parsedData.heroes,
        preview.parsedData.artifacts,
        preview.parsedData.heroTypes,
        activeRslAccount.id,
        userId,
      );

      addLog("Fetching existing champions from database…");
      const { data: existing, error: fetchErr } = await supabase
        .from("champions")
        .select("id, name")
        .eq("rsl_account_id", activeRslAccount.id);
      if (fetchErr) throw fetchErr;

      const existingMap = new Map<string, string>(
        (existing ?? []).map((c: { id: string; name: string }) => [
          c.name.toLowerCase(),
          c.id,
        ]),
      );

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let totalGear = 0;

      addLog(`Upserting ${mapped.length} champions…`);

      for (const champion of mapped) {
        if (!champion.name) { skipped++; continue; }

        const { gear, ...rest } = champion as IChampion & { gear?: unknown };
        const existingId = existingMap.get(champion.name.toLowerCase());

        const row = {
          ...rest,
          parsed_skills: JSON.stringify(rest.skills ?? []),
          parsed_aura:   rest.aura ? JSON.stringify(rest.aura) : null,
          skills:        undefined,
          aura:          undefined,
        };

        if (existingId) {
          const { error: upErr } = await supabase
            .from("champions")
            .update(row)
            .eq("id", existingId);
          if (upErr) { skipped++; continue; }
          updated++;
        } else {
          const { error: insErr } = await supabase
            .from("champions")
            .insert([row]);
          if (insErr) { skipped++; continue; }
          inserted++;
        }

        if (gear) totalGear += (gear as unknown[]).length;
      }

      // Save gear to localStorage
      const gearStore: Record<string, unknown[]> = JSON.parse(
        localStorage.getItem("rtk_gear_data") ?? "{}",
      );
      for (const [name, gearList] of Object.entries(gearByChampionName)) {
        gearStore[name.toLowerCase()] = gearList;
      }
      localStorage.setItem("rtk_gear_data", JSON.stringify(gearStore));

      // Bust champion cache
      localStorage.removeItem("supabase_champion_list");
      localStorage.removeItem("supabase_team_list");

      setResult({ inserted, updated, gearItems: totalGear, skipped });
      setStage("done");
      addLog("Import complete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setStage("error");
    }
  };

  const reset = () => {
    setStage("idle");
    setPreview(null);
    setResult(null);
    setError("");
    setLog([]);
  };

  return (
    <div className="overflow-auto h-[92vh] p-4 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Import from JSON</h1>
      <p className="text-sm text-gray-500">
        Upload an export file from <strong>RSL Helper</strong>,{" "}
        <strong>Raid Toolkit</strong>, or any tool that uses the RaidExtractor
        format. Works on any platform — Mac, Windows, Steam or Plarium Play.
      </p>

      {/* ── How to get a file ── */}
      <div className="border rounded-xl p-4 bg-gray-50 space-y-2">
        <h2 className="font-semibold text-sm">How to get a JSON export</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
          <div className="space-y-1">
            <p className="font-semibold text-gray-700">Windows (Plarium Play or Steam)</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Install RSL Helper or Raid Toolkit</li>
              <li>Open the game</li>
              <li>Export / Save as JSON</li>
              <li>Upload the file here</li>
            </ol>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-gray-700">Mac (Plarium Play)</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Open Proxyman or mitmproxy</li>
              <li>Trust the certificate &amp; enable proxy</li>
              <li>Launch Raid — it loads your account data on startup</li>
              <li>Copy the <code className="bg-gray-200 px-1 rounded">/api/</code> response body as JSON</li>
              <li>Save as <code className="bg-gray-200 px-1 rounded">.json</code> and upload here</li>
            </ol>
          </div>
        </div>
      </div>

      {!activeRslAccount && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          No active RSL account found. Please add and activate one first.
        </div>
      )}

      {/* ── Drop zone ── */}
      {stage === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition cursor-pointer
            ${isDragging ? "border-amber-500 bg-amber-50" : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"}`}
          onClick={() => document.getElementById("json-file-input")?.click()}
        >
          <MdOutlineUploadFile size={40} className="text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">
            Drag &amp; drop your export file here
          </p>
          <p className="text-xs text-gray-400">or click to browse</p>
          <input
            id="json-file-input"
            type="file"
            accept=".json"
            className="hidden"
            onChange={onFileInput}
          />
        </div>
      )}

      {/* ── Error ── */}
      {stage === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <FaExclamationTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Could not read file</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
          <button type="button" onClick={reset} className="text-xs text-gray-500 underline cursor-pointer">
            Try another file
          </button>
        </div>
      )}

      {/* ── Preview ── */}
      {(stage === "preview" || stage === "importing") && preview && (
        <div className="border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm">File Preview</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Heroes found",    value: preview.heroCount,                         color: "text-blue-600" },
              { label: "Artifacts found", value: preview.artifactCount,                     color: "text-amber-600" },
              { label: "Stats included",  value: preview.hasStats ? "Yes" : "No",           color: preview.hasStats ? "text-green-600" : "text-gray-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center border">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {preview.warnings.length > 0 && (
            <div className="space-y-2">
              {preview.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <FaExclamationTriangle size={12} className="shrink-0 mt-0.5" />
                  <p>{w}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleImport}
              disabled={stage === "importing" || !activeRslAccount}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <FaFileUpload size={13} className={stage === "importing" ? "animate-bounce" : ""} />
              {stage === "importing" ? "Importing…" : "Import"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={stage === "importing"}
              className="px-4 py-2 rounded-lg border text-sm text-gray-500 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {log.length > 0 && (
            <div className="bg-gray-900 text-gray-300 rounded-lg p-3 text-xs font-mono space-y-0.5 max-h-28 overflow-auto">
              {log.map((line, i) => <p key={i}>› {line}</p>)}
            </div>
          )}
        </div>
      )}

      {/* ── Done ── */}
      {stage === "done" && result && (
        <div className="space-y-4">
          <div className="border-2 border-green-400 rounded-xl p-4 bg-green-50 space-y-3">
            <h2 className="font-semibold text-sm text-green-800 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" size={16} /> Import Complete
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "New Champions", value: result.inserted,  color: "text-green-600" },
                { label: "Updated",       value: result.updated,   color: "text-blue-600" },
                { label: "Gear Items",    value: result.gearItems, color: "text-amber-600" },
                { label: "Skipped",       value: result.skipped,   color: "text-gray-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-700">
              Head to the Champions screen to see your roster with gear sets displayed on each card.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              <FaSync size={12} /> Import another file
            </button>
          </div>

          {log.length > 0 && (
            <div className="bg-gray-900 text-gray-300 rounded-lg p-3 text-xs font-mono space-y-0.5 max-h-28 overflow-auto">
              {log.map((line, i) => <p key={i}>› {line}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
