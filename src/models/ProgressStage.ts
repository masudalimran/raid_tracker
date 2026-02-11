export const ProgressStage = {
  BEGINNING: "Beginning",
  EARLY_GAME: "Early Game",
  MID_GAME: "Mid Game",
  LATE_GAME: "Late Game",
  END_GAME: "End Game",
} as const;

export type ProgressStage = (typeof ProgressStage)[keyof typeof ProgressStage];
