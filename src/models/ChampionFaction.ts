export const ChampionFaction = {
    BANNER_LORDS: "Banner Lords",
    DARK_ELVES: "Dark Elves",
} as const;

export type ChampionFaction =
    (typeof ChampionFaction)[keyof typeof ChampionFaction];
