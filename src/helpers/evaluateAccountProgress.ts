import { ChampionFaction } from "../models/ChampionFaction";
import type ITeam from "../models/ITeam";
import { ProgressStage } from "../models/ProgressStage";
import { ARENA } from "../models/game_areas/Arena";
import { CLAN_BOSS } from "../models/game_areas/ClanBoss";
import { DOOM_TOWER_BOSS } from "../models/game_areas/DoomTowerBoss";
import { DUNGEON } from "../models/game_areas/Dungeon";
import { HYDRA } from "../models/game_areas/Hydra";
import { fromSlug } from "./fromSlug";

/* ============================================================
   TYPES
============================================================ */

type RuleFn = (teams: ITeam[]) => boolean;

interface ProgressRule {
  description: string;
  test: RuleFn;
}

interface ProgressRuleSet {
  stage: ProgressStage;
  rules: ProgressRule[];
}

export interface ProgressEvaluation {
  currentStage: ProgressStage;
  completed: Record<ProgressStage, string[]>;
  nextSteps: Record<ProgressStage, string[]>;
}

/* ============================================================
   HELPERS
============================================================ */

function stageAtLeast(stage: string, min: number): boolean {
  const match = stage.toUpperCase().match(/(\d+)/);
  if (!match) return false;
  return Number(match[1]) >= min;
}

function hasTeam(
  teams: ITeam[],
  teamNames: string[],
  predicate: (team: ITeam) => boolean,
): boolean {
  const normalizedNames = teamNames.map((n) => n.toUpperCase());
  return teams.some((team) => {
    const readableName = fromSlug(team.team_name).toUpperCase();
    return normalizedNames.includes(readableName) && predicate(team);
  });
}

function allTeams(
  teams: ITeam[],
  teamNames: string[],
  predicate: (team: ITeam) => boolean,
): boolean {
  const normalizedNames = teamNames.map((n) => n.toUpperCase());
  return normalizedNames.every((name) =>
    teams.some(
      (team) =>
        fromSlug(team.team_name).toUpperCase() === name && predicate(team),
    ),
  );
}

/* ============================================================
   RULE DEFINITIONS
============================================================ */

const COMMON_DUNGEONS = [
  DUNGEON.DRAGON,
  DUNGEON.ICE_GOLEM,
  DUNGEON.SPIDER,
  DUNGEON.FIRE_KNIGHT,
];
const COMMON_DUNGEONS_HARD = [
  DUNGEON.DRAGON_HARD,
  DUNGEON.ICE_GOLEM_HARD,
  DUNGEON.SPIDER_HARD,
  DUNGEON.FIRE_KNIGHT_HARD,
];
const FACTIONS = Object.values(ChampionFaction);
const HYDRA_HEADS = [HYDRA.HYDRA_A, HYDRA.HYDRA_B, HYDRA.HYDRA_C];
const DOOM_TOWER_NORMAL = [
  DOOM_TOWER_BOSS.SCARAB_KING,
  DOOM_TOWER_BOSS.MAGMA_DRAGON,
  DOOM_TOWER_BOSS.NETHER_SPIDER,
  DOOM_TOWER_BOSS.GRYPHON,
  DOOM_TOWER_BOSS.BOMMAL,
  DOOM_TOWER_BOSS.DARK_FAE,
  DOOM_TOWER_BOSS.ETERNAL_DRAGON,
  DOOM_TOWER_BOSS.FROST_SPIDER,
];
const DOOM_TOWER_HARD = [
  DOOM_TOWER_BOSS.SCARAB_KING_HARD,
  DOOM_TOWER_BOSS.MAGMA_DRAGON_HARD,
  DOOM_TOWER_BOSS.NETHER_SPIDER_HARD,
  DOOM_TOWER_BOSS.GRYPHON_HARD,
  DOOM_TOWER_BOSS.BOMMAL_HARD,
  DOOM_TOWER_BOSS.DARK_FAE_HARD,
  DOOM_TOWER_BOSS.ETERNAL_DRAGON_HARD,
  DOOM_TOWER_BOSS.FROST_SPIDER_HARD,
];

/* ============================================================
   PROGRESS RULES
============================================================ */

const PROGRESS_RULES: ProgressRuleSet[] = [
  {
    stage: ProgressStage.EARLY_GAME,
    rules: [
      {
        description: "Normal Dungeons ≥ Stage 16",
        test: (teams) =>
          allTeams(teams, COMMON_DUNGEONS, (t) =>
            stageAtLeast(t.clearing_stage, 16),
          ),
      },
      {
        description: "Faction Wars ≥ Stage 7",
        test: (teams) =>
          allTeams(teams, FACTIONS, (t) => stageAtLeast(t.clearing_stage, 7)),
      },
      {
        description: "Demon Lord ≥ 1-Key Hard",
        test: (teams) =>
          hasTeam(teams, [CLAN_BOSS.DEMON_LORD], (t) => {
            const s = t.clearing_stage.toUpperCase();
            return (
              s.includes("1-KEY HARD") ||
              s.includes("1-KEY NIGHTMARE") ||
              s.includes("1-KEY ULTRA-NIGHTMARE") ||
              s.includes("3-KEY ULTRA-NIGHTMARE")
            );
          }),
      },
      {
        description: "Classic Arena Silver or Gold",
        test: (teams) =>
          hasTeam(teams, [ARENA.CLASSIC_ARENA], (t) => {
            const s = t.clearing_stage.toUpperCase();
            return s.includes("SILVER") || s.includes("GOLD");
          }),
      },
    ],
  },
  {
    stage: ProgressStage.MID_GAME,
    rules: [
      {
        description: "Normal Dungeons ≥ Stage 20",
        test: (teams) =>
          allTeams(teams, COMMON_DUNGEONS, (t) =>
            stageAtLeast(t.clearing_stage, 20),
          ),
      },
      {
        description: "Complete all Normal Doom Tower bosses",
        test: (teams) =>
          allTeams(teams, DOOM_TOWER_NORMAL, (t) =>
            t.clearing_stage.toUpperCase().includes("COMPLETE"),
          ),
      },
      {
        description: "Demon Lord ≥ 1-Key Nightmare or 3-Key Ultra-Nightmare",
        test: (teams) =>
          hasTeam(teams, [CLAN_BOSS.DEMON_LORD], (t) => {
            const s = t.clearing_stage.toUpperCase();
            return (
              s.includes("1-KEY NIGHTMARE") ||
              s.includes("3-KEY ULTRA-NIGHTMARE") ||
              s.includes("1-KEY ULTRA-NIGHTMARE")
            );
          }),
      },
      {
        description: "Faction Wars Max",
        test: (teams) =>
          allTeams(teams, FACTIONS, (t) =>
            t.clearing_stage.toUpperCase().includes("MAX"),
          ),
      },
      {
        description: "Classic Arena Gold",
        test: (teams) =>
          hasTeam(teams, [ARENA.CLASSIC_ARENA], (t) =>
            t.clearing_stage.toUpperCase().includes("GOLD"),
          ),
      },
    ],
  },
  {
    stage: ProgressStage.LATE_GAME,
    rules: [
      {
        description: "Normal Dungeons ≥ Stage 25",
        test: (teams) =>
          allTeams(teams, COMMON_DUNGEONS, (t) =>
            stageAtLeast(t.clearing_stage, 25),
          ),
      },
      {
        description: "Demon Lord ≥ 2-Key Ultra-Nightmare",
        test: (teams) =>
          hasTeam(teams, [CLAN_BOSS.DEMON_LORD], (t) => {
            const s = t.clearing_stage.toUpperCase();
            return (
              s.includes("2-KEY ULTRA-NIGHTMARE") ||
              s.includes("3-KEY ULTRA-NIGHTMARE") ||
              s.includes("1-KEY ULTRA-NIGHTMARE")
            );
          }),
      },
      {
        description: "Complete all Hard Doom Tower bosses",
        test: (teams) =>
          allTeams(teams, DOOM_TOWER_HARD, (t) =>
            t.clearing_stage.toUpperCase().includes("COMPLETE"),
          ),
      },
      {
        description: "1-Key Brutal Hydra",
        test: (teams) =>
          hasTeam(teams, HYDRA_HEADS, (t) =>
            t.clearing_stage.toUpperCase().includes("1-KEY BRUTAL"),
          ),
      },
    ],
  },
  {
    stage: ProgressStage.END_GAME,
    rules: [
      {
        description: "Hard Mode Dungeons MAX",
        test: (teams) =>
          allTeams(teams, COMMON_DUNGEONS_HARD, (t) =>
            t.clearing_stage.toUpperCase().includes("MAX"),
          ),
      },
      {
        description: "Iron Twin MAX",
        test: (teams) =>
          hasTeam(teams, [DUNGEON.IRON_TWIN], (t) =>
            t.clearing_stage.toUpperCase().includes("MAX"),
          ),
      },
      {
        description: "Classic Arena Platinum",
        test: (teams) =>
          hasTeam(teams, [ARENA.CLASSIC_ARENA], (t) =>
            t.clearing_stage.toUpperCase().includes("PLATINUM"),
          ),
      },
      {
        description: "Nightmare Hydra 1-Key",
        test: (teams) =>
          hasTeam(teams, HYDRA_HEADS, (t) =>
            t.clearing_stage.toUpperCase().includes("1-KEY NIGHTMARE"),
          ),
      },
    ],
  },
];

/* ============================================================
   MAIN FUNCTION
============================================================ */

export function evaluateAccountProgressDetailed(
  teams: ITeam[],
): ProgressEvaluation {
  const completed: Record<ProgressStage, string[]> = {
    Beginning: [],
    "Early Game": [],
    "Mid Game": [],
    "Late Game": [],
    "End Game": [],
  };
  const nextSteps: Record<ProgressStage, string[]> = {
    Beginning: [],
    "Early Game": [],
    "Mid Game": [],
    "Late Game": [],
    "End Game": [],
  };

  if (!teams?.length) {
    return { currentStage: ProgressStage.BEGINNING, completed, nextSteps };
  }

  let currentStage: ProgressStage = ProgressStage.BEGINNING;

  for (const ruleSet of PROGRESS_RULES) {
    const stageCompleted: string[] = [];
    const stageNext: string[] = [];

    for (const rule of ruleSet.rules) {
      const passed = rule.test(teams);
      if (passed) stageCompleted.push(rule.description);
      else stageNext.push(rule.description);
    }

    completed[ruleSet.stage] = stageCompleted;
    nextSteps[ruleSet.stage] = stageNext;

    // first incomplete stage becomes current
    if (stageNext.length > 0 && currentStage === ProgressStage.BEGINNING) {
      currentStage = ruleSet.stage;
    }
  }

  return { currentStage, completed, nextSteps };
}
