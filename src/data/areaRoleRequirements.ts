/**
 * Key roles each game area needs covered.
 *
 * Keys are the ENUM KEYS (e.g. "DEMON_LORD", "DRAGON", "BANNER_LORDS")
 * because buildAreaRoutes passes Object.keys(source) as the teamKey prop.
 *
 * Coverage is detected from:
 *  1. champion.role[]           — works immediately if champion roles are tagged
 *  2. champion.skills[].effects — used when skill data has been entered
 */

import { ChampionRole } from "../models/ChampionRole";
import type { TeamIdentifier } from "./team_priority_weight";
import type IChampion from "../models/IChampion";

export interface AreaRoleReq {
  label: string;
  tip: string;
  matchRoles?: ChampionRole[];
  matchEffects?: string[];
}

const r = (
  label: string,
  tip: string,
  matchRoles: ChampionRole[] = [],
  matchEffects: string[] = [],
): AreaRoleReq => ({ label, tip, matchRoles, matchEffects });

// ── Faction Wars ─────────────────────────────────────────────────────────────
const FACTION_WARS_REQS: AreaRoleReq[] = [
  r("Reviver",            "Most important role in FW — recovers fallen champions",
    [ChampionRole.REVIVER]),
  r("Speed Booster",      "Go first and control tempo",
    [ChampionRole.SPEED_BOOSTER, ChampionRole.TM_BOOSTER]),
  r("Cleanser",           "Remove debuffs applied by the FW boss",
    [ChampionRole.CLEANSER]),
  r("Healer",             "Sustain the team through multi-wave content",
    [ChampionRole.HEALER]),
  r("Crowd Control",      "Lock down enemies to control wave pace",
    [ChampionRole.CONTROL, ChampionRole.FREEZE, ChampionRole.STUN]),
  r("Heal on Enemy Death","Passive healing triggered when enemies die — excellent in FW waves",
    [ChampionRole.HEAL_ON_DEATH]),
  r("Multi Hitter",       "Multiple hits build ally turn meter through waves",
    [ChampionRole.MULTI_HITTER]),
];

// ── Potion Keep (same for all four) ──────────────────────────────────────────
const POTION_KEEP_REQS: AreaRoleReq[] = [
  r("Buffer",    "Increase allies' stats to push through waves",
    [ChampionRole.BUFFER], ["Increase ATK", "Increase DEF", "Increase SPD"]),
  r("Debuffer",  "Weaken enemies to take less damage and deal more",
    [ChampionRole.DEBUFFER], ["Decrease ATK", "Decrease DEF", "Weaken"]),
  r("Nuker",     "Burst down waves quickly",
    [ChampionRole.NUKER], []),
];

export const AREA_ROLE_REQUIREMENTS: Partial<Record<TeamIdentifier, AreaRoleReq[]>> = {

  // ── Potion Keep ───────────────────────────────────────────────────────────
  ARCANE_POTION: POTION_KEEP_REQS,
  SPIRIT_POTION: POTION_KEEP_REQS,
  VOID_POTION:   POTION_KEEP_REQS,
  FORCE_POTION:  POTION_KEEP_REQS,

  // ── Clan Boss ─────────────────────────────────────────────────────────────
  DEMON_LORD: [
    r("Decrease ATK",  "Reduces Clan Boss ATK — critical for survival",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Decrease DEF",  "Amplifies all damage dealt to the boss",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Weaken",        "Further damage amplification",
      [ChampionRole.WEAKEN], ["Weaken"]),
    r("Poison / DoT",  "Core damage source for CB",
      [ChampionRole.POISONER], ["Poison", "HP Burn"]),
    r("HP Burn",       "Percentage-based damage every turn",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Speed Booster", "Ensures the team acts frequently",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
    r("Unkillable",    "Prevents deaths — needed for max damage runs",
      [ChampionRole.UNKILLABLE], ["Unkillable", "Block Damage"]),
    r("TM Reduction",  "Slows boss turn meter",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
  ],
  CHIMERA: [
    r("Decrease ATK",  "Reduces Chimera's ATK",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Decrease SPD",  "Slows Chimera's cycle",
      [ChampionRole.TM_REDUCER], ["Decrease SPD", "TM Reduction"]),
    r("Poison / DoT",  "Sustained damage",
      [ChampionRole.POISONER], ["Poison"]),
    r("HP Burn",       "Stacks with Poison for big damage",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("TM Reduction",  "Controls Chimera's pace",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Block Buffs",   "Prevents Chimera buffing itself",
      [ChampionRole.BLOCK_BUFF], ["Block Buffs"]),
    r("Reviver",       "Keeps the team alive",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
  ],

  // ── Dungeons ──────────────────────────────────────────────────────────────
  DRAGON: [
    r("Poison",        "Primary damage source for Dragon",
      [ChampionRole.POISONER], ["Poison"]),
    r("HP Burn",       "Additional DoT layer",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Decrease ATK",  "Reduces Dragon's ATK to survive hits",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Decrease DEF",  "Amplifies all damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Weaken",        "Further amplification",
      [ChampionRole.WEAKEN], ["Weaken"]),
  ],
  DRAGON_HARD: [
    r("Poison",        "Primary damage source",
      [ChampionRole.POISONER], ["Poison"]),
    r("Decrease ATK",  "Reduces Dragon's massive ATK",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Decrease DEF",  "Amplifies damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Speed Booster", "Outpace Dragon's waves",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
    r("Reviver",       "Hard mode requires sustain",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
  ],
  ICE_GOLEM: [
    r("Decrease ATK",  "Reduces golem and adds' ATK",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Crowd Control", "Freeze / Stun adds",
      [ChampionRole.CONTROL], ["Freeze", "Stun", "Sleep"]),
    r("Reviver",       "Ice Golem AoE can wipe teams",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
    r("Healer",        "Sustained healing for lengthy fight",
      [ChampionRole.HEALER], ["Continuous Heal"]),
  ],
  ICE_GOLEM_HARD: [
    r("Decrease ATK",  "Critical — hard adds hit very hard",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Crowd Control", "Stun / Freeze adds immediately",
      [ChampionRole.CONTROL], ["Freeze", "Stun", "Sleep"]),
    r("Reviver",       "Mandatory at hard difficulty",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
    r("Block Buffs",   "Golem hard buffs itself",
      [ChampionRole.BLOCK_BUFF], ["Block Buffs"]),
  ],
  SPIDER: [
    r("AoE Nuker",     "Kill spiderlings quickly each wave",
      [ChampionRole.NUKER], []),
    r("TM Reduction",  "Prevent spiderlings from taking too many turns",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Crowd Control", "Freeze / Stun spiderlings to control waves",
      [ChampionRole.CONTROL], ["Freeze", "Stun", "Sleep"]),
    r("HP Burn",       "Tick damage on boss and spiderlings",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Decrease DEF",  "Required to burst the boss",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
  ],
  SPIDER_HARD: [
    r("AoE Nuker",     "Spiderlings hit harder — clear fast",
      [ChampionRole.NUKER], []),
    r("TM Reduction",  "Control spiderling turn meter",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Crowd Control", "Lock down spiderlings",
      [ChampionRole.CONTROL], ["Freeze", "Stun", "Sleep"]),
    r("HP Burn",       "Sustained boss damage",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Decrease DEF",  "Amplifies burst",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
  ],
  FIRE_KNIGHT: [
    r("TM Reduction",      "Breaks the Fire Knight's shield faster",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Single Target DPS", "Must hit the boss between shields",
      [ChampionRole.NUKER], []),
    r("Decrease DEF",      "Amplifies damage between shields",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
  ],
  FIRE_KNIGHT_HARD: [
    r("TM Reduction",      "Essential — shield recharges fast",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Single Target DPS", "Burst between shield windows",
      [ChampionRole.NUKER], []),
    r("Decrease DEF",      "Amplifies damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Speed Booster",     "Outpace the boss",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
  ],
  SAND_DEVIL: [
    r("HP Burn",       "Percentage-based damage — core Sand Devil mechanic",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Decrease DEF",  "Increases all damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Sleep",         "Sleep debuff to control Sand Devil's phase rotation",
      [ChampionRole.SLEEP_DEBUFFER], ["Sleep"]),
    r("Reviver",       "Sand Devil's AoE can wipe the team",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
  ],
  SHOGUN: [
    r("Decrease ATK",  "Mitigate Shogun's massive ATK",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("TM Reduction",  "Critical — Shogun is very fast",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("AoE DPS",       "Clear waves quickly",
      [ChampionRole.NUKER], []),
    r("Reviver",       "Shogun executioner mechanic",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
  ],
  IRON_TWIN: [
    r("Decrease DEF",  "Required for damage phases",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Decrease SPD",  "Slow Iron Twin to control its deadly turn cycles",
      [ChampionRole.TM_REDUCER], ["Decrease SPD", "TM Reduction"]),
    r("Healer",        "Iron Twin reflects damage — need sustain",
      [ChampionRole.HEALER], ["Continuous Heal"]),
    r("Speed Booster", "Act before Iron Twin's deadly turns",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
  ],

  // ── Hydra ─────────────────────────────────────────────────────────────────
  HYDRA_A: [
    r("Block Buffs",      "Stops Hydra heads from buffing",
      [ChampionRole.BLOCK_BUFF, ChampionRole.HYDRA], ["Block Buffs"]),
    r("Provoker",         "Keep heads focused and limit their actions",
      [ChampionRole.PROVOKER], ["Provoke"]),
    r("Leech",            "Counters Hydra's healing mechanic",
      [ChampionRole.LEECH], ["Leech"]),
    r("Decrease DEF",     "Amplifies all head damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Poison / HP Burn", "Sustained damage across all heads",
      [ChampionRole.POISONER, ChampionRole.HP_BURNER], ["Poison", "HP Burn"]),
  ],
  HYDRA_B: [
    r("Block Buffs",      "Essential — same as head A",
      [ChampionRole.BLOCK_BUFF, ChampionRole.HYDRA], ["Block Buffs"]),
    r("Provoker",         "Keep heads focused and limit their actions",
      [ChampionRole.PROVOKER], ["Provoke"]),
    r("Leech",            "Counters Hydra healing",
      [ChampionRole.LEECH], ["Leech"]),
    r("Decrease ATK",     "Reduce incoming damage",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Poison / HP Burn", "Core Hydra damage",
      [ChampionRole.POISONER, ChampionRole.HP_BURNER], ["Poison", "HP Burn"]),
  ],
  HYDRA_C: [
    r("Block Buffs",      "Essential for all Hydra heads",
      [ChampionRole.BLOCK_BUFF, ChampionRole.HYDRA], ["Block Buffs"]),
    r("Provoker",         "Keep heads focused and limit their actions",
      [ChampionRole.PROVOKER], ["Provoke"]),
    r("Leech",            "Counters Hydra healing",
      [ChampionRole.LEECH], ["Leech"]),
    r("Decrease DEF",     "Amplifies damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Reviver",          "Third head should sustain the team",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
  ],

  // ── Arena ─────────────────────────────────────────────────────────────────
  CLASSIC_ARENA: [
    r("Speed Opener",  "Fastest champion acts first and sets up the team",
      [ChampionRole.ARENA, ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
    r("Nuker",         "One-shots or bursts the enemy team",
      [ChampionRole.NUKER, ChampionRole.ARENA], []),
    r("Crowd Control", "Stun / freeze / sleep the enemy team",
      [ChampionRole.CONTROL], ["Stun", "Freeze", "Sleep", "Provoke"]),
    r("Decrease DEF",  "Required to enable the nuker",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
  ],
  TAG_ARENA_A: [
    r("Nuker",         "Tag Arena rewards burst damage",
      [ChampionRole.NUKER, ChampionRole.ARENA], []),
    r("Speed Booster", "Get the team moving first",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
    r("Crowd Control", "Lock down enemy waves",
      [ChampionRole.CONTROL], ["Stun", "Freeze"]),
  ],
  TAG_ARENA_B: [
    r("Nuker",          "Burst damage in Tag Arena waves",
      [ChampionRole.NUKER, ChampionRole.ARENA], []),
    r("Decrease DEF",   "Enable nuke damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Healer / Shield","Sustain through multiple waves",
      [ChampionRole.HEALER], ["Continuous Heal", "Shield"]),
  ],
  TAG_ARENA_C: [
    r("Nuker",        "Close out rounds fast",
      [ChampionRole.NUKER, ChampionRole.ARENA], []),
    r("Reviver",      "Third team needs longevity",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
    r("Decrease DEF", "Enable burst",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
  ],

  // ── Doom Tower Normal ─────────────────────────────────────────────────────
  SCARAB_KING: [
    r("Crowd Control", "Stun / freeze adds to stop their attacks",
      [ChampionRole.CONTROL], ["Stun", "Freeze", "Sleep", "Provoke"]),
    r("TM Reduction",  "Slow Scarab and adds' turn meter",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Shield",        "Protect the team from Scarab's heavy hits",
      [ChampionRole.SHIELDER], ["Shield", "Ally Protector"]),
  ],
  MAGMA_DRAGON: [
    r("Poison",       "Primary damage — Dragon immune during phases",
      [ChampionRole.POISONER], ["Poison"]),
    r("HP Burn",      "Stacks with Poison",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Decrease DEF", "Amplifies damage in vulnerable phases",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Block Buffs",  "Stops self-buffing in later floors",
      [ChampionRole.BLOCK_BUFF], ["Block Buffs"]),
  ],
  NETHER_SPIDER: [
    r("AoE Nuker",    "Kill spiderlings — same mechanic as Dungeon Spider",
      [ChampionRole.NUKER, ChampionRole.DOOM_TOWER], []),
    r("Reviver",      "Spiderlings drain HP rapidly",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
    r("Healer",       "Sustain through web phases",
      [ChampionRole.HEALER], ["Continuous Heal"]),
    r("Cleanser",     "Clear web debuffs — 2 recommended",
      [ChampionRole.CLEANSER], ["Block Debuffs"]),
    r("2nd Cleanser", "Web stacks require a second cleanser to keep up",
      [ChampionRole.CLEANSER], ["Block Debuffs"]),
  ],
  GRYPHON: [
    r("Decrease ATK", "Gryphon ATK shreds without mitigation",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Decrease SPD", "Slow the Gryphon's cycle further",
      [ChampionRole.TM_REDUCER], ["Decrease SPD"]),
    r("TM Reduction", "Slow the Gryphon's turn meter",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Reviver",      "Gryphon can one-shot champions",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
    r("Block Buffs",  "Stops Gryphon's shields",
      [ChampionRole.BLOCK_BUFF], ["Block Buffs"]),
  ],
  BOMMAL: [
    r("Bomb Defuse",  "Block Debuffs / cleanse to survive bombs",
      [ChampionRole.CLEANSER, ChampionRole.DOOM_TOWER], ["Block Debuffs"]),
    r("Decrease ATK", "Reduce Bommal's strike damage",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
    r("Reviver",      "Bombs will kill without defuse",
      [ChampionRole.REVIVER], ["Revive", "Revive On Death"]),
    r("Unkillable",   "Unkillable comps ignore bombs entirely",
      [ChampionRole.UNKILLABLE], ["Unkillable", "Block Damage"]),
  ],
  DARK_FAE: [
    r("TM Reduction",  "Critical — Dark Fae copies champion skills",
      [ChampionRole.TM_REDUCER], ["TM Reduction", "Decrease SPD"]),
    r("Speed Booster", "Ensure your team acts before Dark Fae",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
    r("AoE Nuker",     "Burst down Dark Fae quickly",
      [ChampionRole.NUKER], []),
    r("Crowd Control", "Stun / freeze the Dark Fae",
      [ChampionRole.CONTROL], ["Stun", "Freeze", "Provoke"]),
  ],
  ETERNAL_DRAGON: [
    r("Poison",       "Main damage vector",
      [ChampionRole.POISONER], ["Poison"]),
    r("Decrease DEF", "Amplify all damage",
      [ChampionRole.DECREASE_DEF], ["Decrease DEF"]),
    r("Speed Booster","Outpace Dragon's damage waves",
      [ChampionRole.SPEED_BOOSTER], ["Increase SPD", "TM Boost"]),
  ],
  FROST_SPIDER: [
    r("AoE Nuker",    "Burst spiderlings fast",
      [ChampionRole.NUKER, ChampionRole.DOOM_TOWER], []),
    r("HP Burner",    "Sustained percentage damage on boss and spiderlings",
      [ChampionRole.HP_BURNER], ["HP Burn"]),
    r("Healer",       "Web effects drain constantly",
      [ChampionRole.HEALER], ["Continuous Heal"]),
    r("Decrease ATK", "Frost Spider hits hard",
      [ChampionRole.DECREASE_ATK], ["Decrease ATK"]),
  ],

  // ── Doom Tower Hard — same roles as normal ────────────────────────────────
};

Object.assign(AREA_ROLE_REQUIREMENTS, {
  SCARAB_KING_HARD:    AREA_ROLE_REQUIREMENTS.SCARAB_KING,
  MAGMA_DRAGON_HARD:   AREA_ROLE_REQUIREMENTS.MAGMA_DRAGON,
  NETHER_SPIDER_HARD:  AREA_ROLE_REQUIREMENTS.NETHER_SPIDER,
  GRYPHON_HARD:        AREA_ROLE_REQUIREMENTS.GRYPHON,
  BOMMAL_HARD:         AREA_ROLE_REQUIREMENTS.BOMMAL,
  DARK_FAE_HARD:       AREA_ROLE_REQUIREMENTS.DARK_FAE,
  ETERNAL_DRAGON_HARD: AREA_ROLE_REQUIREMENTS.ETERNAL_DRAGON,
  FROST_SPIDER_HARD:   AREA_ROLE_REQUIREMENTS.FROST_SPIDER,

  // ── Faction Wars ──────────────────────────────────────────────────────────
  ARGONITES:        FACTION_WARS_REQS,
  BANNER_LORDS:     FACTION_WARS_REQS,
  BARBARIANS:       FACTION_WARS_REQS,
  DARK_ELVES:       FACTION_WARS_REQS,
  DEMON_SPAWNS:     FACTION_WARS_REQS,
  DWARVES:          FACTION_WARS_REQS,
  HIGH_ELVES:       FACTION_WARS_REQS,
  KNIGHTS_REVENANT: FACTION_WARS_REQS,
  LIZARDMEN:        FACTION_WARS_REQS,
  OGRYN_TRIBES:     FACTION_WARS_REQS,
  ORCS:             FACTION_WARS_REQS,
  SACRED_ORDER:     FACTION_WARS_REQS,
  SHADOWKINS:       FACTION_WARS_REQS,
  SKIN_WALKERS:     FACTION_WARS_REQS,
  SYLVAN_WATCHERS:  FACTION_WARS_REQS,
  UNDEAD_HORDES:    FACTION_WARS_REQS,
});

// ── Override-aware requirement lookup ────────────────────────────────────────

import { getTeamOverride } from "../helpers/teamRoleOverrides";

/** Returns requirements for a team, preferring user's localStorage override. */
export function getTeamRequirements(teamKey: string): AreaRoleReq[] {
  const override = getTeamOverride(teamKey);
  if (override !== null) return override;
  return AREA_ROLE_REQUIREMENTS[teamKey] ?? [];
}

// ── Coverage checker ──────────────────────────────────────────────────────────

export interface CoverageResult {
  req: AreaRoleReq;
  coveredBy: string[];
}

/** A requirement is covered if any champion in the team has the required role tagged. */
export function checkTeamCoverage(
  requirements: AreaRoleReq[],
  teamChampions: IChampion[],
): CoverageResult[] {
  return requirements.map((req) => ({
    req,
    coveredBy: teamChampions
      .filter((champ) => req.matchRoles?.some((role) => champ.role?.includes(role)))
      .map((champ) => champ.name),
  }));
}

/** Returns the labels of requirements this champion satisfies based solely on their tagged roles. */
export function getChampionRoleMatches(
  champion: IChampion,
  requirements: AreaRoleReq[],
): string[] {
  return requirements
    .filter((req) => req.matchRoles?.some((role) => champion.role?.includes(role)))
    .map((req) => req.label);
}
