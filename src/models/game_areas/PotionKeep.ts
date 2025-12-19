export const POTION_KEEP = {
  ARCANE_POTION: "Arcane Potion",
  SPIRIT_POTION: "Spirit Potion",
  VOID_POTION: "Void Potion",
  FORCE_POTION: "Force Potion",
} as const;

export type POTION_KEEP = (typeof POTION_KEEP)[keyof typeof POTION_KEEP];
