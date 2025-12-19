export const ARENA = {
  CLASSIC_ARENA: "Classic Arena",
  TAG_ARENA_A: "Tag Arena A",
  TAG_ARENA_B: "Tag Arena B",
  TAG_ARENA_C: "Tag Arena C",
} as const;

export type ARENA = (typeof ARENA)[keyof typeof ARENA];
