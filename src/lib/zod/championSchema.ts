import { z } from "zod";
import { ChampionType } from "../../models/ChampionType";
import { ChampionAffinity } from "../../models/ChampionAffinity";
import { ChampionRole } from "../../models/ChampionRole";
import { ChampionRarity } from "../../models/ChampionRarity";
import { ChampionFaction } from "../../models/ChampionFaction";

export const skillEffectSchema = z.object({
  name: z.string().min(1, "Effect name required"),
  type: z.enum(["buff", "debuff"]),
  cool_down: z.number().min(0),
  land_chance: z.number().min(0).max(100),
  duration: z.number().optional(),
  count: z.number().optional(),
  target: z.enum(["All", "Single", "Random_Multiple"]),
});

export const skillSchema = z.object({
  skill_index: z.number().min(1),
  effects: z.array(skillEffectSchema),
});

// Aura Schema
export const auraSchema = z.object({
  effect: z.string().optional(),
  active_in: z.enum(["All", "Arena", "Dungeons", "Faction Wars", "Doom Tower"]),
  effectiveness: z.string().optional(),
});

export const championSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imgUrl: z.string().url().optional().or(z.literal("")),
  championUrl: z.string().url().optional().or(z.literal("")),

  hp: z
    .number()
    .int("HP must be an integer")
    .min(0, "HP cannot be negative")
    .max(999999, "HP too large"),

  atk: z
    .number()
    .int("ATK must be an integer")
    .min(0, "ATK cannot be negative")
    .max(9999, "ATK too large"),

  def: z
    .number()
    .int("DEF must be an integer")
    .min(0, "DEF cannot be negative")
    .max(9999, "DEF too large"),

  spd: z
    .number()
    .int("SPD must be an integer")
    .min(0, "SPD cannot be negative")
    .max(999, "SPD too large"),

  c_rate: z
    .number()
    .int("C. Rate must be an integer")
    .min(0, "C. Rate cannot be negative")
    .max(150, "C. Rate too large"),

  c_dmg: z
    .number()
    .int("C. DMG must be an integer")
    .min(0, "C. DMG cannot be negative")
    .max(999, "C. DMG too large"),

  res: z
    .number()
    .int("RES must be an integer")
    .min(0, "RES cannot be negative")
    .max(1000, "RES too large"),

  acc: z
    .number()
    .int("ACC must be an integer")
    .min(0, "ACC cannot be negative")
    .max(1000, "ACC too large"),

  level: z.number().int().min(1).max(60),
  affinity: z.enum(
    Object.values(ChampionAffinity) as [
      ChampionAffinity,
      ...ChampionAffinity[],
    ],
  ),
  type: z.enum(
    Object.values(ChampionType) as [ChampionType, ...ChampionType[]],
  ),
  rarity: z.enum(
    Object.values(ChampionRarity) as [ChampionRarity, ...ChampionRarity[]],
  ),
  faction: z.enum(
    Object.values(ChampionFaction) as [ChampionFaction, ...ChampionFaction[]],
  ),
  role: z.array(
    z.enum(Object.values(ChampionRole) as [ChampionRole, ...ChampionRole[]]),
  ),

  stars: z.number().int().min(1).max(6),
  ascension_stars: z.number().int().min(0).max(6),
  awaken_stars: z.number().int().min(0).max(6),

  is_booked: z.boolean(),
  is_book_needed: z.boolean(),
  has_mastery: z.boolean(),
  is_mastery_needed: z.boolean(),

  user_id: z.string().uuid(),
  rsl_account_id: z.string().uuid(),

  skills: z.array(skillSchema),
  aura: auraSchema.optional(),
});

export type ChampionFormData = z.infer<typeof championSchema>;
