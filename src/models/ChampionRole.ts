export const ChampionRole = {
  NUKER: "Nuker",
  DEBUFFER: "Debuffer",
  BUFFER: "Buffer",
  SPEED_BOOSTER: "Speed Booster",
  TM_REDUCER: "TM Reducer",
  HEALER: "Healer",
  CONTROL: "CC",
  REVIVER: "Reviver",
  CAMPAIGN_FARMER: "Campaign Farmer",
  DEMON_LORD: "Demon Lord",
  HYDRA: "Hydra",
  CHIMERA: "Chimera",
  BOSS_KILLER: "Boss Killer",
  UNKILLABLE: "Unkillable",
  POISONER: "Poisoner",
  HP_BURNER: "HP Burner",
  MAX_HP_DPS: "Max HP DPS",
  ARENA: "Arena",
} as const;

export type ChampionRole = (typeof ChampionRole)[keyof typeof ChampionRole];
