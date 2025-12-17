export const ChampionRole = {
    NUKER: "nuker",
    DEBUFFER: "debuffer",
    SUPPORT: "support",
    CONTROL: "control",
    REVIVER: "reviver",
} as const;

export type ChampionRole =
    (typeof ChampionRole)[keyof typeof ChampionRole];
