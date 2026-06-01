import { ChampionRole } from "../models/ChampionRole";

export interface RoleCategory {
  label: string;
  accent: string; // Tailwind text colour for section headers
  roles: ChampionRole[];
}

export const ROLE_CATEGORIES: RoleCategory[] = [
  {
    label: "DPS",
    accent: "text-red-600",
    roles: [
      ChampionRole.NUKER,
      ChampionRole.POISONER,
      ChampionRole.HP_BURNER,
      ChampionRole.MAX_HP_DPS,
      ChampionRole.BOSS_KILLER,
      ChampionRole.CAMPAIGN_FARMER,
    ],
  },
  {
    label: "Buff",
    accent: "text-blue-600",
    roles: [
      ChampionRole.BUFFER,
      ChampionRole.SPEED_BOOSTER,
      ChampionRole.HEALER,
      ChampionRole.REVIVER,
      ChampionRole.CLEANSER,
      ChampionRole.SHIELDER,
      ChampionRole.UNKILLABLE,
    ],
  },
  {
    label: "Debuff",
    accent: "text-purple-600",
    roles: [
      ChampionRole.DEBUFFER,
      ChampionRole.TM_REDUCER,
      ChampionRole.CONTROL,
      ChampionRole.BLOCK_BUFF,
      ChampionRole.PROVOKER,
      ChampionRole.LEECH,
      ChampionRole.SLEEP_DEBUFFER,
      ChampionRole.DECREASE_ATK,
      ChampionRole.DECREASE_DEF,
      ChampionRole.WEAKEN,
    ],
  },
  {
    label: "Specialist",
    accent: "text-amber-600",
    roles: [
      ChampionRole.DEMON_LORD,
      ChampionRole.HYDRA,
      ChampionRole.CHIMERA,
      ChampionRole.ARENA,
      ChampionRole.DOOM_TOWER,
    ],
  },
];
