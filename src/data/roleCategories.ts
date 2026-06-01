import { ChampionRole } from "../models/ChampionRole";

export interface RoleCategory {
  label: string;
  accent: string;
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
      ChampionRole.POISON_ACTIVATOR,
      ChampionRole.HP_BURN_ACTIVATOR,
      ChampionRole.MULTI_HITTER,
      ChampionRole.ALLY_ATTACK,
    ],
  },
  {
    label: "Buff",
    accent: "text-blue-600",
    roles: [
      ChampionRole.BUFFER,
      ChampionRole.SPEED_BOOSTER,
      ChampionRole.TM_BOOSTER,
      ChampionRole.HEALER,
      ChampionRole.REVIVER,
      ChampionRole.CLEANSER,
      ChampionRole.SHIELDER,
      ChampionRole.UNKILLABLE,
      ChampionRole.INCREASE_ATK,
      ChampionRole.INCREASE_ACC,
      ChampionRole.INCREASE_DEF,
      ChampionRole.STRENGTHEN,
      ChampionRole.COUNTERATTACK,
      ChampionRole.ALLY_PROTECTION,
      ChampionRole.HEAL_ON_DEATH,
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
      ChampionRole.BUFF_STRIP,
      ChampionRole.PROVOKER,
      ChampionRole.LEECH,
      ChampionRole.SLEEP_DEBUFFER,
      ChampionRole.FREEZE,
      ChampionRole.STUN,
      ChampionRole.DECREASE_ATK,
      ChampionRole.DECREASE_DEF,
      ChampionRole.DECREASE_SPD,
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
