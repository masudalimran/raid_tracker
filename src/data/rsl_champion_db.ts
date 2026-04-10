/**
 * RSL Champion Database
 *
 * Stores identity data for well-known RSL champions so the form can
 * auto-fill affinity, type, rarity, faction, image URL, and hellhades URL
 * from just the champion name.
 *
 * Stats (HP, ATK, DEF, etc.) are NOT included — those depend on gear
 * and must be entered manually from in-game.
 *
 * To add a champion: copy any entry, update the fields, and add it to
 * RSL_CHAMPION_DB using the champion name in lowercase as the key.
 */

import { ChampionAffinity } from "../models/ChampionAffinity";
import { ChampionFaction } from "../models/ChampionFaction";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionType } from "../models/ChampionType";

export interface RSLChampionDBEntry {
  name: string;
  imgUrl: string;
  championUrl: string;
  affinity: string; // ChampionAffinity path value
  type: string;     // ChampionType value
  rarity: string;   // ChampionRarity value
  faction: string;  // ChampionFaction value
}

function entry(
  name: string,
  affinity: string,
  type: string,
  rarity: string,
  faction: string,
): RSLChampionDBEntry {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return {
    name,
    imgUrl: `https://raid.guru/image/cache/catalog/options/${slug}-800x800.png`,
    championUrl: `https://hellhades.com/raid/champions/${slug}/`,
    affinity,
    type,
    rarity,
    faction,
  };
}

const A = ChampionAffinity;
const T = ChampionType;
const R = ChampionRarity;
const F = ChampionFaction;

export const RSL_CHAMPION_DB: Record<string, RSLChampionDBEntry> = {
  // ── Banner Lords ──────────────────────────────────────────────────
  "septimus": entry("Septimus", A.SPIRIT, T.ATTACK, R.LEGENDARY, F.BANNER_LORDS),
  "raglin": entry("Raglin", A.FORCE, T.SUPPORT, R.LEGENDARY, F.BANNER_LORDS),
  "seeker": entry("Seeker", A.FORCE, T.SUPPORT, R.EPIC, F.BANNER_LORDS),
  "stag knight": entry("Stag Knight", A.MAGIC, T.DEFENSE, R.EPIC, F.BANNER_LORDS),

  // ── High Elves ────────────────────────────────────────────────────
  "lyssandra": entry("Lyssandra", A.VOID, T.SUPPORT, R.LEGENDARY, F.HIGH_ELVES),
  "tayrel": entry("Tayrel", A.FORCE, T.DEFENSE, R.LEGENDARY, F.HIGH_ELVES),
  "royal guard": entry("Royal Guard", A.FORCE, T.ATTACK, R.EPIC, F.HIGH_ELVES),
  "marksman": entry("Marksman", A.MAGIC, T.ATTACK, R.EPIC, F.HIGH_ELVES),

  // ── Sacred Order ─────────────────────────────────────────────────
  "arbiter": entry("Arbiter", A.VOID, T.SUPPORT, R.LEGENDARY, F.SACRED_ORDER),
  "deacon armstrong": entry("Deacon Armstrong", A.FORCE, T.SUPPORT, R.LEGENDARY, F.SACRED_ORDER),
  "armiger": entry("Armiger", A.FORCE, T.DEFENSE, R.EPIC, F.SACRED_ORDER),
  "aothar": entry("Aothar", A.SPIRIT, T.ATTACK, R.EPIC, F.SACRED_ORDER),
  "godseeker aniri": entry("Godseeker Aniri", A.VOID, T.SUPPORT, R.LEGENDARY, F.SACRED_ORDER),

  // ── Barbarians ────────────────────────────────────────────────────
  "scyl of the drakes": entry("Scyl of the Drakes", A.FORCE, T.SUPPORT, R.LEGENDARY, F.BARBARIANS),
  "valkyrie": entry("Valkyrie", A.FORCE, T.DEFENSE, R.LEGENDARY, F.BARBARIANS),
  "turvold": entry("Turvold", A.FORCE, T.ATTACK, R.LEGENDARY, F.BARBARIANS),
  "ultimate deathknight": entry("Ultimate Deathknight", A.VOID, T.ATTACK, R.LEGENDARY, F.BARBARIANS),

  // ── Ogryn Tribes ─────────────────────────────────────────────────
  "warlord": entry("Warlord", A.VOID, T.SUPPORT, R.LEGENDARY, F.OGRYN_TRIBES),
  "skullcrusher": entry("Skullcrusher", A.VOID, T.DEFENSE, R.EPIC, F.OGRYN_TRIBES),
  "big un": entry("Big Un", A.FORCE, T.DEFENSE, R.EPIC, F.OGRYN_TRIBES),
  "occult brawler": entry("Occult Brawler", A.FORCE, T.ATTACK, R.EPIC, F.OGRYN_TRIBES),

  // ── Lizardmen ─────────────────────────────────────────────────────
  "krisk the ageless": entry("Krisk the Ageless", A.FORCE, T.DEFENSE, R.LEGENDARY, F.LIZARDMEN),
  "jareg": entry("Jareg", A.FORCE, T.DEFENSE, R.EPIC, F.LIZARDMEN),
  "broadmaw": entry("Broadmaw", A.FORCE, T.HP, R.EPIC, F.LIZARDMEN),

  // ── Skin Walkers ──────────────────────────────────────────────────
  "fayne": entry("Fayne", A.MAGIC, T.ATTACK, R.EPIC, F.SKIN_WALKERS),
  "norog": entry("Norog", A.FORCE, T.HP, R.LEGENDARY, F.SKIN_WALKERS),

  // ── Orcs ──────────────────────────────────────────────────────────
  "supreme galek": entry("Supreme Galek", A.FORCE, T.ATTACK, R.LEGENDARY, F.ORCS),
  "pain keeper": entry("Pain Keeper", A.VOID, T.SUPPORT, R.EPIC, F.ORCS),
  "galek": entry("Galek", A.FORCE, T.ATTACK, R.RARE, F.ORCS),

  // ── Demon Spawns ──────────────────────────────────────────────────
  "helicath": {
    name: "Helicath",
    imgUrl: "https://raid.guru/image/cache/catalog/options/helicath-800x800.png",
    championUrl: "https://hellhades.com/raid/champions/helicath/",
    affinity: A.SPIRIT,
    type: T.DEFENSE,
    rarity: R.LEGENDARY,
    faction: F.DEMON_SPAWNS,
  },
  "duchess lilitu": entry("Duchess Lilitu", A.VOID, T.SUPPORT, R.LEGENDARY, F.DEMON_SPAWNS),
  "tyrant ixlimor": entry("Tyrant Ixlimor", A.VOID, T.ATTACK, R.LEGENDARY, F.DEMON_SPAWNS),
  "mordecai": entry("Mordecai", A.VOID, T.SUPPORT, R.LEGENDARY, F.DEMON_SPAWNS),

  // ── Undead Hordes ─────────────────────────────────────────────────
  "siphi the lost bride": entry("Siphi the Lost Bride", A.VOID, T.SUPPORT, R.LEGENDARY, F.UNDEAD_HORDES),
  "rotos the lost groom": entry("Rotos the Lost Groom", A.MAGIC, T.ATTACK, R.LEGENDARY, F.UNDEAD_HORDES),
  "nekhret the great": entry("Nekhret the Great", A.VOID, T.DEFENSE, R.LEGENDARY, F.UNDEAD_HORDES),
  "mausoleum mage": entry("Mausoleum Mage", A.MAGIC, T.SUPPORT, R.LEGENDARY, F.UNDEAD_HORDES),
  "candraphon": entry("Candraphon", A.VOID, T.ATTACK, R.LEGENDARY, F.UNDEAD_HORDES),
  "maneater": entry("Maneater", A.VOID, T.HP, R.EPIC, F.UNDEAD_HORDES),
  "doompriest": entry("Doompriest", A.VOID, T.SUPPORT, R.EPIC, F.UNDEAD_HORDES),
  "ghostborn": entry("Ghostborn", A.VOID, T.HP, R.EPIC, F.UNDEAD_HORDES),
  "miscreated monster": entry("Miscreated Monster", A.VOID, T.HP, R.EPIC, F.UNDEAD_HORDES),

  // ── Dark Elves ────────────────────────────────────────────────────
  "kael": {
    name: "Kael",
    imgUrl: "https://raid.guru/image/cache/catalog/options/kael-800x800.png",
    championUrl: "https://hellhades.com/raid/champions/kael/",
    affinity: A.MAGIC,
    type: T.ATTACK,
    rarity: R.RARE,
    faction: F.DARK_ELVES,
  },
  "lydia the deathsiren": entry("Lydia the Deathsiren", A.VOID, T.SUPPORT, R.LEGENDARY, F.DARK_ELVES),
  "rector drath": entry("Rector Drath", A.MAGIC, T.SUPPORT, R.LEGENDARY, F.DARK_ELVES),
  "venus": entry("Venus", A.MAGIC, T.ATTACK, R.LEGENDARY, F.DARK_ELVES),
  "foli": entry("Foli", A.SPIRIT, T.ATTACK, R.LEGENDARY, F.DARK_ELVES),

  // ── Knights Revenant ──────────────────────────────────────────────
  "skartorsis": entry("Skartorsis", A.VOID, T.DEFENSE, R.LEGENDARY, F.KNIGHTS_REVENANT),
  "saito": entry("Saito", A.VOID, T.ATTACK, R.LEGENDARY, F.KNIGHTS_REVENANT),
  "kaiden": entry("Kaiden", A.SPIRIT, T.ATTACK, R.EPIC, F.KNIGHTS_REVENANT),

  // ── Dwarves ───────────────────────────────────────────────────────
  "tormin the cold": entry("Tormin the Cold", A.MAGIC, T.DEFENSE, R.LEGENDARY, F.DWARVES),
  "trunda giltmallet": entry("Trunda Giltmallet", A.FORCE, T.ATTACK, R.LEGENDARY, F.DWARVES),
  "geomancer": entry("Geomancer", A.FORCE, T.HP, R.EPIC, F.DWARVES),

  // ── Shadowkins ────────────────────────────────────────────────────
  "yumeko": entry("Yumeko", A.VOID, T.ATTACK, R.LEGENDARY, F.SHADOWKINS),
  "xena": entry("Xena", A.FORCE, T.DEFENSE, R.LEGENDARY, F.SHADOWKINS),

  // ── Sylvan Watchers ───────────────────────────────────────────────
  "ruella": {
    name: "Ruella",
    imgUrl: "https://raid.guru/image/cache/catalog/options/ruella-800x800.png",
    championUrl: "https://hellhades.com/raid/champions/ruella/",
    affinity: A.SPIRIT,
    type: T.ATTACK,
    rarity: R.EPIC,
    faction: F.SYLVAN_WATCHERS,
  },
  "elva autumnborn": entry("Elva Autumnborn", A.SPIRIT, T.SUPPORT, R.LEGENDARY, F.SYLVAN_WATCHERS),
  "atur": entry("Atur", A.VOID, T.DEFENSE, R.LEGENDARY, F.SYLVAN_WATCHERS),
};

/**
 * Look up a champion by name (case-insensitive).
 * Returns null if not found in the database.
 */
export function getChampionFromDB(name: string): RSLChampionDBEntry | null {
  const key = name.toLowerCase().trim();
  return RSL_CHAMPION_DB[key] ?? null;
}

/** All champion names in the DB, sorted alphabetically. */
export const RSL_CHAMPION_NAMES: string[] = Object.values(RSL_CHAMPION_DB)
  .map((c) => c.name)
  .sort((a, b) => a.localeCompare(b));
