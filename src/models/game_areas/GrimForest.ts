export const GRIM_FOREST = {
  GRIM_FOREST_DECK_1: "Grim Forest Deck 1",
  GRIM_FOREST_DECK_2: "Grim Forest Deck 2",
} as const;

export type GRIM_FOREST = (typeof GRIM_FOREST)[keyof typeof GRIM_FOREST];

// Normal-mode Grim Forest: 2 decks of 10 champions each, no champion shared
// between decks. (Hard mode's 20-per-deck isn't modeled here.)
export const GRIM_FOREST_DECK_SIZE = 10;

// Slugs match what toSlug() produces from either this model's keys or values
// (they're written to coincide) — this is what gets stored as ITeam.team_name.
export const GRIM_FOREST_DECK_1_SLUG = "grim_forest_deck_1";
export const GRIM_FOREST_DECK_2_SLUG = "grim_forest_deck_2";
