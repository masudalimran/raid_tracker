import { ChampionAffinity } from "../models/ChampionAffinity";
import { ChampionFaction } from "../models/ChampionFaction";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionType } from "../models/ChampionType";
import type IChampion from "../models/IChampion";
import type { ChampionReconciliationPlanEntry } from "./handleChampions";

// Champion data-research workflow: export a list of champion names that need
// data filled in (default/missing image), hand them to an AI that can look
// the champions up, then import its structured response back in to patch
// the matching roster entries.

export interface ChampionImportRow {
  name: string;
  rarity?: string;
  faction?: string;
  affinity?: string;
  type?: string;
  imgUrl?: string;
  championUrl?: string;
}

const AFFINITY_BY_NAME: Record<string, ChampionAffinity> = {
  magic: ChampionAffinity.MAGIC,
  force: ChampionAffinity.FORCE,
  spirit: ChampionAffinity.SPIRIT,
  void: ChampionAffinity.VOID,
};

const VALID_RARITIES = new Set<string>(Object.values(ChampionRarity));
const VALID_FACTIONS = new Set<string>(Object.values(ChampionFaction));
const VALID_TYPES = new Set<string>(Object.values(ChampionType));

export const buildChampionResearchPrompt = (names: string[]): string => {
  const rarityList = Object.values(ChampionRarity).join(", ");
  const factionList = Object.values(ChampionFaction)
    .filter((f) => f !== ChampionFaction.OTHER)
    .join(", ");
  const typeList = Object.values(ChampionType)
    .filter((t) => t !== ChampionType.OTHER)
    .join(", ");

  return `I'm compiling data for a Raid: Shadow Legends champion tracker app. For each champion name listed below, research accurate information and respond with ONLY a JSON array (no markdown code fences, no commentary before or after) — one object per champion, in exactly this shape:

[
  {
    "name": "<exact champion name>",
    "rarity": "<one of: ${rarityList}>",
    "faction": "<one of: ${factionList}>",
    "affinity": "<one of: Magic, Force, Spirit, Void>",
    "type": "<one of: ${typeList}>",
    "imgUrl": "<a direct URL to a good quality portrait/artwork image of this champion>",
    "championUrl": "<this champion's page on hellhades.com, e.g. https://hellhades.com/raid/champions/<slug>/>"
  }
]

Champion names:
${names.map((n) => `- ${n}`).join("\n")}

Return valid JSON only, with exactly one object per champion name above, using the exact enum values listed.`;
};

// Gemini and similar assistants often wrap JSON responses in a ```json code
// fence even when told not to — strip it before parsing rather than failing.
export const parseChampionImportPayload = (raw: string): ChampionImportRow[] => {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of champion objects.");
  return parsed as ChampionImportRow[];
};

export interface ChampionImportResult {
  plan: ChampionReconciliationPlanEntry[];
  matchedNames: string[];
  unmatchedNames: string[];
}

export const buildChampionImportPlan = (
  rows: ChampionImportRow[],
  roster: IChampion[],
): ChampionImportResult => {
  const byName = new Map(
    roster.filter((c) => c.id != null).map((c) => [c.name.trim().toLowerCase(), c]),
  );

  const plan: ChampionReconciliationPlanEntry[] = [];
  const matchedNames: string[] = [];
  const unmatchedNames: string[] = [];

  for (const row of rows) {
    if (!row.name) continue;
    const champion = byName.get(row.name.trim().toLowerCase());
    if (!champion || champion.id == null) {
      unmatchedNames.push(row.name);
      continue;
    }

    const patch: Partial<IChampion> = {};
    if (row.rarity && VALID_RARITIES.has(row.rarity)) {
      patch.rarity = row.rarity as IChampion["rarity"];
    }
    if (row.faction && VALID_FACTIONS.has(row.faction)) {
      patch.faction = row.faction as IChampion["faction"];
    }
    if (row.type && VALID_TYPES.has(row.type)) {
      patch.type = row.type as IChampion["type"];
    }
    if (row.affinity) {
      const mapped = AFFINITY_BY_NAME[row.affinity.trim().toLowerCase()];
      if (mapped) patch.affinity = mapped;
    }
    if (row.imgUrl?.trim()) patch.imgUrl = row.imgUrl.trim();
    if (row.championUrl?.trim()) patch.championUrl = row.championUrl.trim();

    if (Object.keys(patch).length > 0) {
      plan.push({ id: champion.id, name: champion.name, patch });
      matchedNames.push(champion.name);
    } else {
      unmatchedNames.push(row.name);
    }
  }

  return { plan, matchedNames, unmatchedNames };
};
