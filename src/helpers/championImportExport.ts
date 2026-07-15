import { ChampionAffinity } from "../models/ChampionAffinity";
import { ChampionFaction } from "../models/ChampionFaction";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionType } from "../models/ChampionType";
import { ChampionRole } from "../models/ChampionRole";
import { ROLE_CATEGORIES } from "../data/roleCategories";
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
  championUrl?: string;
}

// AI assistants (Gemini especially, when search-grounded) sometimes return
// URLs wrapped as markdown links — "[real-url](google-redirect-or-real-url)"
// — instead of a plain string. The link text is consistently the real URL in
// both cases we've seen (a Google search-redirect href, or a plain duplicate
// href), so prefer it; only fall back to unwrapping a Google redirect's `q=`
// param if the link text itself isn't a URL.
const MARKDOWN_LINK_RE = /^\[(.+)\]\((.+)\)$/s;

export const cleanImportedUrl = (value?: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(MARKDOWN_LINK_RE);
  if (!match) return trimmed;

  const [, linkText, href] = match;
  if (/^https?:\/\//i.test(linkText.trim())) return linkText.trim();

  try {
    const redirectQuery = new URL(href.trim()).searchParams.get("q");
    if (redirectQuery) return redirectQuery;
  } catch {
    // href wasn't a valid URL — fall through to returning it as-is
  }
  return href.trim();
};

// Images gemini has provided from this workflow have consistently not loaded
// (hellhades.com blocks hotlinking to its uploads), so this import no longer
// requests or applies imgUrl at all — images are added manually instead.

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

  return `I'm compiling data for a Raid: Shadow Legends champion tracker app. For each champion name listed below, research accurate information and respond with ONLY a JSON array (no markdown code fences, no commentary before or after, and no markdown links — plain strings only) — one object per champion, in exactly this shape:

[
  {
    "name": "<exact champion name>",
    "rarity": "<one of: ${rarityList}>",
    "faction": "<one of: ${factionList}>",
    "affinity": "<one of: Magic, Force, Spirit, Void>",
    "type": "<one of: ${typeList}>",
    "championUrl": "<this champion's page on hellhades.com as a plain URL string, e.g. https://hellhades.com/raid/champions/<slug>/ — not a markdown link>"
  }
]

Champion names:
${names.map((n) => `- ${n}`).join("\n")}

Return valid JSON only, with exactly one object per champion name above, using the exact enum values listed.`;
};

// Gemini and similar assistants often wrap JSON responses in a ```json code
// fence even when told not to — strip it before parsing rather than failing.
export const parseChampionImportPayload = <T = ChampionImportRow>(raw: string): T[] => {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of champion objects.");
  return parsed as T[];
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
    // imgUrl is deliberately not imported — hellhades.com blocks hotlinking,
    // so AI-provided image URLs never actually load. Images are added
    // manually via the No Image filter instead.
    if (row.championUrl?.trim()) {
      const cleaned = cleanImportedUrl(row.championUrl);
      if (cleaned) patch.championUrl = cleaned;
    }

    if (Object.keys(patch).length > 0) {
      plan.push({ id: champion.id, name: champion.name, patch });
      matchedNames.push(champion.name);
    } else {
      unmatchedNames.push(row.name);
    }
  }

  return { plan, matchedNames, unmatchedNames };
};

// ── Role research (for under-roled champions) ──────────────────────────────

export interface ChampionRoleImportRow {
  name: string;
  roles?: string[];
}

const ALL_VALID_ROLES = new Set<string>(Object.values(ChampionRole));

export const buildChampionRoleResearchPrompt = (names: string[]): string => {
  const roleListText = ROLE_CATEGORIES.map(
    (category) => `${category.label}: ${category.roles.join(", ")}`,
  ).join("\n");

  return `I'm tagging champion roles for a Raid: Shadow Legends tracker app. For each champion name listed below, determine which of the following roles genuinely describe what that champion is used for, and respond with ONLY a JSON array (no markdown code fences, no commentary before or after) — one object per champion, in exactly this shape:

[
  { "name": "<exact champion name>", "roles": ["<role>", "<role>", ...] }
]

Only use role values from this exact list (case-sensitive, use the exact spelling/capitalization shown):
${roleListText}
Not Viable (use only if this champion has no realistic use in any content)

Pick every role that genuinely applies — most useful champions warrant 3-6 roles. Don't invent roles outside this list.

Champion names:
${names.map((n) => `- ${n}`).join("\n")}

Return valid JSON only, with exactly one object per champion name above.`;
};

// New roles are merged into whatever roles a champion already has (never
// removed), since the goal is filling in gaps on under-roled champions, not
// replacing roles someone already tagged correctly.
export const buildChampionRoleImportPlan = (
  rows: ChampionRoleImportRow[],
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

    const validNewRoles = (row.roles ?? []).filter((r) => ALL_VALID_ROLES.has(r));
    const existingRoles = champion.role ?? [];
    const mergedRoles = Array.from(new Set([...existingRoles, ...validNewRoles])) as ChampionRole[];

    if (mergedRoles.length > existingRoles.length) {
      plan.push({ id: champion.id, name: champion.name, patch: { role: mergedRoles } });
      matchedNames.push(champion.name);
    } else {
      unmatchedNames.push(row.name);
    }
  }

  return { plan, matchedNames, unmatchedNames };
};
