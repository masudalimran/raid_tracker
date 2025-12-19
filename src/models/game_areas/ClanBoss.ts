export const CLAN_BOSS = {
  DEMON_LORD: "Demon Lord",
  CHIMERA: "Chimera",
} as const;

export type CLAN_BOSS = (typeof CLAN_BOSS)[keyof typeof CLAN_BOSS];
