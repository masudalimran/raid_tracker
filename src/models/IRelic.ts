import type { ChampionRarity } from "./ChampionRarity";

export const RelicGroup = {
  STANDARD: "Standard",
  CHIMERA: "Chimera",
  CLAN: "Clan",
  LIVE_ARENA: "Live Arena",
  FACTION_WARS: "Faction Wars",
  GRIM_FOREST: "Grim Forest",
  FORGE_PASS: "Forge Pass",
  EVENT: "Event",
} as const;

export type RelicGroup = (typeof RelicGroup)[keyof typeof RelicGroup];

export default interface IRelic {
  /** Stable id — matches the image filename (no extension) in /public/img/relics/, and what's stored on a champion's `relics` array. */
  id: string;
  /** Human-readable display name, e.g. "The Cat's Gaze". */
  name: string;
  rarity: ChampionRarity;
  group: RelicGroup;
  /** Short mechanical effect description at base rank. */
  description: string;
}
