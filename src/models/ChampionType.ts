export const ChampionType = {
  ATTACK: "Attack",
  SUPPORT: "Support",
  DEFENSE: "Defense",
  HP: "HP",
  OTHER: "Other",
} as const;

export type ChampionType = (typeof ChampionType)[keyof typeof ChampionType];
