import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  fetchRtkAccounts,
  fetchRtkSyncPayload,
  resetRtkConnection,
} from "../services/rtkService";
import type { AccountInfo } from "../services/rtkService";
import { mapRtkPayload } from "../helpers/mapRtkData";
import type IChampion from "../models/IChampion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaLink,
  FaSync,
  FaWifi,
} from "react-icons/fa";
import { MdOutlineSignalWifiOff } from "react-icons/md";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type SyncStatus = "idle" | "syncing" | "done" | "error";

interface SyncResult {
  inserted: number;
  updated: number;
  gearItems: number;
  skipped: number;
}

const RTK_INSTALL_URL = "https://raidtoolkit.com";

function StatusBadge({ status }: { status: ConnectionStatus }) {
  if (status === "idle")
    return <span className="text-xs text-gray-400">Not connected</span>;
  if (status === "connecting")
    return <span className="text-xs text-amber-500 animate-pulse">Connecting…</span>;
  if (status === "connected")
    return (
      <span className="flex items-center gap-1 text-xs text-green-500">
        <FaCheckCircle size={11} /> Connected
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <FaExclamationTriangle size={11} /> Connection failed
    </span>
  );
}

export default function RtkSync() {
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("idle");
  const [connError, setConnError] = useState<string>("");
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string>("");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  const auth = JSON.parse(localStorage.getItem("supabase_auth") || "{}");
  const userId: string = auth?.user?.id ?? "";

  const rslAccounts: Array<{ id: string; is_currently_active: boolean }> =
    JSON.parse(localStorage.getItem("supabase_rsl_account_list") ?? "[]");
  const activeRslAccount = rslAccounts.find((a) => a.is_currently_active);

  const handleConnect = async () => {
    setConnStatus("connecting");
    setConnError("");
    resetRtkConnection();
    try {
      const result = await fetchRtkAccounts();
      setAccounts(result);
      setSelectedAccountId(result[0]?.id ?? "");
      setConnStatus("connected");
    } catch (e) {
      setConnStatus("error");
      setConnError(
        e instanceof Error
          ? e.message
          : "Could not reach Raid Toolkit. Make sure it is running.",
      );
    }
  };

  const log = (msg: string) => setSyncLog((prev) => [...prev, msg]);

  const handleSync = async () => {
    if (!selectedAccountId || !userId || !activeRslAccount) return;
    setSyncStatus("syncing");
    setSyncError("");
    setSyncLog([]);
    setSyncResult(null);

    try {
      log("Fetching data from Raid Toolkit…");
      const payload = await fetchRtkSyncPayload(selectedAccountId);
      log(`Found ${payload.heroes.length} heroes and ${payload.artifacts.length} artifacts.`);

      const { champions: mappedChampions, gearByChampionName } = mapRtkPayload(
        payload.heroes,
        payload.artifacts,
        payload.heroTypes,
        activeRslAccount.id,
        userId,
      );

      log("Fetching existing champions from database…");
      const { data: existingChampions, error: fetchError } = await supabase
        .from("champions")
        .select("id, name")
        .eq("rsl_account_id", activeRslAccount.id);

      if (fetchError) throw fetchError;

      const existingMap = new Map<string, string>(
        (existingChampions ?? []).map((c: { id: string; name: string }) => [
          c.name.toLowerCase(),
          c.id,
        ]),
      );

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let totalGear = 0;

      log("Syncing champions…");

      for (const champion of mappedChampions) {
        if (!champion.name) { skipped++; continue; }

        const { gear, ...rest } = champion as IChampion & { gear?: unknown };
        const existingId = existingMap.get(champion.name.toLowerCase());

        const row = {
          ...rest,
          parsed_skills: JSON.stringify(rest.skills ?? []),
          parsed_aura: rest.aura ? JSON.stringify(rest.aura) : null,
          skills: undefined,
          aura: undefined,
        };

        if (existingId) {
          const { error } = await supabase
            .from("champions")
            .update(row)
            .eq("id", existingId);
          if (error) { skipped++; continue; }
          updated++;
        } else {
          const { error } = await supabase.from("champions").insert([row]);
          if (error) { skipped++; continue; }
          inserted++;
        }

        if (gear) totalGear += (gear as unknown[]).length;
      }

      // Persist gear in localStorage keyed by champion name
      const existingGearStore: Record<string, unknown[]> = JSON.parse(
        localStorage.getItem("rtk_gear_data") ?? "{}",
      );
      for (const [name, gearList] of Object.entries(gearByChampionName)) {
        existingGearStore[name.toLowerCase()] = gearList;
      }
      localStorage.setItem("rtk_gear_data", JSON.stringify(existingGearStore));

      // Bust champion cache so grid reloads fresh
      localStorage.removeItem("supabase_champion_list");
      localStorage.removeItem("supabase_team_list");

      setSyncResult({ inserted, updated, gearItems: totalGear, skipped });
      setSyncStatus("done");
      log("Sync complete.");
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed.");
      setSyncStatus("error");
    }
  };

  return (
    <div className="overflow-auto h-[92vh] p-4 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Raid Toolkit Sync</h1>
      <p className="text-sm text-gray-500">
        Automatically import your live champion stats and equipped gear directly
        from Raid Shadow Legends — no manual entry needed.
      </p>

      {/* ── Setup guide ── */}
      <div className="border rounded-xl p-4 bg-gray-50 space-y-2">
        <h2 className="font-semibold text-sm">Setup (one-time)</h2>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>
            Download and install{" "}
            <a
              href={RTK_INSTALL_URL}
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 underline inline-flex items-center gap-1"
            >
              Raid Toolkit <FaLink size={10} />
            </a>{" "}
            (free, Windows only — same tool HellHades Optimizer uses)
          </li>
          <li>Open Raid Shadow Legends via Plarium Play and log into your account</li>
          <li>Make sure Raid Toolkit is running in your system tray</li>
          <li>Click <strong>Connect</strong> below — this app will pull data automatically</li>
        </ol>
        <p className="text-xs text-gray-400 pt-1">
          RTK reads game memory locally. No data leaves your machine to a third-party server.
        </p>
      </div>

      {/* ── Connection ── */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Connection</h2>
          <StatusBadge status={connStatus} />
        </div>

        {connStatus !== "connected" ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connStatus === "connecting"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {connStatus === "connecting" ? (
              <FaSync size={13} className="animate-spin" />
            ) : (
              <FaWifi size={13} />
            )}
            {connStatus === "connecting" ? "Connecting…" : "Connect to Raid Toolkit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setConnStatus("idle"); setAccounts([]); resetRtkConnection(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-500 hover:bg-gray-100 transition cursor-pointer"
          >
            <MdOutlineSignalWifiOff size={14} /> Disconnect
          </button>
        )}

        {connStatus === "error" && connError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <FaExclamationTriangle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Could not connect</p>
              <p className="text-xs mt-0.5">{connError}</p>
              <p className="text-xs text-red-500 mt-1">
                Make sure Raid Toolkit is running and the game is open.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Account selection + sync ── */}
      {connStatus === "connected" && (
        <div className="border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-sm">Sync</h2>

          {!activeRslAccount && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              No active RSL account found in this app. Please add one first via the account settings.
            </div>
          )}

          {accounts.length > 1 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                RTK Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="basic-input w-full"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Lv {a.level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {accounts.length === 1 && (
            <p className="text-sm text-gray-600">
              Account: <span className="font-semibold">{accounts[0].name}</span>{" "}
              — Level {accounts[0].level}
            </p>
          )}

          <button
            type="button"
            onClick={handleSync}
            disabled={!selectedAccountId || !activeRslAccount || syncStatus === "syncing"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <FaSync size={13} className={syncStatus === "syncing" ? "animate-spin" : ""} />
            {syncStatus === "syncing" ? "Syncing…" : "Sync Champions & Gear"}
          </button>

          {/* Progress log */}
          {syncLog.length > 0 && (
            <div className="bg-gray-900 text-gray-300 rounded-lg p-3 text-xs font-mono space-y-0.5 max-h-32 overflow-auto">
              {syncLog.map((line, i) => (
                <p key={i}>› {line}</p>
              ))}
            </div>
          )}

          {/* Error */}
          {syncStatus === "error" && syncError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <FaExclamationTriangle size={14} className="shrink-0 mt-0.5" />
              <p>{syncError}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {syncStatus === "done" && syncResult && (
        <div className="border-2 border-green-400 rounded-xl p-4 bg-green-50 space-y-3">
          <h2 className="font-semibold text-sm text-green-800 flex items-center gap-2">
            <FaCheckCircle className="text-green-500" size={16} /> Sync Complete
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "New Champions", value: syncResult.inserted, color: "text-green-600" },
              { label: "Updated", value: syncResult.updated, color: "text-blue-600" },
              { label: "Gear Items", value: syncResult.gearItems, color: "text-amber-600" },
              { label: "Skipped", value: syncResult.skipped, color: "text-gray-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center bg-white rounded-lg p-3 shadow-sm">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-700">
            Champion stats and gear have been saved. Head to the Champions screen to see the
            results — gear sets are now shown on each card.
          </p>
        </div>
      )}
    </div>
  );
}
