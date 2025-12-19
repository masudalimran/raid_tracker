export const ChampionType = {
  ATTACK: "Attack",
  SUPPORT: "Support",
  DEFENSE: "Defense",
  HP: "HP",
} as const;

export type ChampionType = (typeof ChampionType)[keyof typeof ChampionType];
