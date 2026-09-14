import type IChampion from "../models/IChampion";
import toSlug from "./toSlug";

export interface ChampionTierEntry {
  champion: string;
  affinity: string;
  role: string;
  support: number;
  dpsPotential: number;
  tankiness: number;
}

// Rarity → the champion_tier_list subfolder for it. Rarities with no folder
// (Mythical, Uncommon, Common) simply have no data yet.
const RARITY_FOLDER: Record<string, string> = {
  Legendary: "legendary",
  Epic: "epic",
  Rare: "rare",
};

// Eagerly bundles every tier-list JSON file so lookups are synchronous —
// files are small and few, so this is cheap even as more factions are added.
const modules = import.meta.glob("../data/champion_tier_list/*/*.json", { eager: true }) as Record<
  string,
  { default: ChampionTierEntry[] }
>;

// path like "../data/champion_tier_list/legendary/banner_lords.json" → { legendary: { banner_lords: [...] } }
const TIER_DATA: Record<string, Record<string, ChampionTierEntry[]>> = {};
for (const [path, mod] of Object.entries(modules)) {
  const match = path.match(/champion_tier_list\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, rarityFolder, factionSlug] = match;
  (TIER_DATA[rarityFolder] ??= {})[factionSlug] = mod.default;
}

/** Looks up this champion's tier-list scores (support/dpsPotential/tankiness), if that faction+rarity file exists and has an entry for it. */
export function getChampionTierScore(champion: IChampion): ChampionTierEntry | undefined {
  const rarityFolder = RARITY_FOLDER[champion.rarity];
  if (!rarityFolder) return undefined;

  const factionSlug = toSlug(champion.faction);
  const entries = TIER_DATA[rarityFolder]?.[factionSlug];
  if (!entries) return undefined;

  const normalizedName = champion.name.trim().toLowerCase();
  return entries.find((e) => e.champion.trim().toLowerCase() === normalizedName);
}

/** Every tier-list entry for a faction+rarity (e.g. every known Legendary Banner Lords champion), or [] if that file doesn't exist yet. */
export function getTierListForFaction(faction: string, rarity: string): ChampionTierEntry[] {
  const rarityFolder = RARITY_FOLDER[rarity];
  if (!rarityFolder) return [];
  return TIER_DATA[rarityFolder]?.[toSlug(faction)] ?? [];
}
