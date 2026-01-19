import type { ChampionRole } from "./ChampionRole.ts";
import type { ChampionAffinity } from "./ChampionAffinity.ts";
import type { ChampionType } from "./ChampionType.ts";
import type { ChampionRarity } from "./ChampionRarity.ts";
import type { ChampionFaction } from "./ChampionFaction.ts";

export default interface IChampion {
  id?: number | string;
  championUrl?: string;
  name: string;
  imgUrl?: string;

  hp: number;
  atk: number;
  def: number;
  spd: number;
  c_rate: number;
  c_dmg: number;
  res: number;
  acc: number;

  level: number;
  affinity: ChampionAffinity;
  type: ChampionType;
  rarity: ChampionRarity;
  faction: ChampionFaction;
  role: ChampionRole[];

  stars: number;
  ascension_stars: number;
  awaken_stars: number;

  is_booked: boolean;
  is_book_needed: boolean;
  has_mastery: boolean;
  is_mastery_needed: boolean;

  user_id?: string;
  rsl_account_id?: string;

  priority?: number;
  champion_impact?: number;
}
