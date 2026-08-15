import type { ChampionRarity } from "./ChampionRarity";

export const BlessingGroup = {
  LIGHT: "Light",
  DARK: "Dark",
  WAR: "War",
  CHAOS: "Chaos",
  HARMONY: "Harmony",
} as const;

export type BlessingGroup = (typeof BlessingGroup)[keyof typeof BlessingGroup];

export default interface IBlessing {
  /** Stable id — matches the image filename (no extension) in /public/img/blessings/, and what's stored on a champion's `blessing` field. */
  id: string;
  /** Human-readable display name, e.g. "Hero's Soul". */
  name: string;
  rarity: ChampionRarity;
  group: BlessingGroup;
  /** Short mechanical effect description at base (1★) rank. */
  description: string;
}
