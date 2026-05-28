export type GearSlot =
  | "Weapon"
  | "Shield"
  | "Helmet"
  | "Chest"
  | "Gloves"
  | "Boots"
  | "Ring"
  | "Amulet"
  | "Banner";

export interface GearStat {
  name: string;
  value: number;
  isAbsolute: boolean;
}

export interface IGear {
  artifactId: number;
  slot: GearSlot;
  setKindId: string;
  setName: string;
  rank: number;
  level: number;
  rarity: string;
  primaryStat: GearStat;
  subStats: GearStat[];
}
