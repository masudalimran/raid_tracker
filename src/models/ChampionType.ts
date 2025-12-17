export const ChampionType = {
  ATTACK: "Attack",
  SUPPORT: "Support",
  DEFENSE: "Defense",
} as const;

export type ChampionType = (typeof ChampionType)[keyof typeof ChampionType];
