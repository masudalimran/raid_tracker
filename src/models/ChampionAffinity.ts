export const ChampionAffinity: {
    readonly SPIRIT: string;
    readonly FORCE: string;
    readonly MAGIC: string;
    readonly VOID: string
} = {
    SPIRIT: "/img/affinities/spirit.png",
    FORCE: "/img/affinities/force.png",
    MAGIC: "/img/affinities/magic.png",
    VOID: "/img/affinities/void.png"
} as const;

export type ChampionAffinity =
    (typeof ChampionAffinity)[keyof typeof ChampionAffinity];
