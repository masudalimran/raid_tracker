export const ShardType = {
  ANCIENT:  "Ancient",
  VOID:     "Void",
  SACRED:   "Sacred",
  PRISM:    "Prism",
} as const;
export type ShardType = (typeof ShardType)[keyof typeof ShardType];

export const PullRarity = {
  COMMON:    "Common",
  UNCOMMON:  "Uncommon",
  RARE:      "Rare",
  EPIC:      "Epic",
  LEGENDARY: "Legendary",
  MYTHICAL:  "Mythical",
} as const;
export type PullRarity = (typeof PullRarity)[keyof typeof PullRarity];

export interface IShardPull {
  id: string;
  shardType: ShardType;
  championName: string;
  rarity: PullRarity;
  pulledAt: string; // ISO date string
  isFragment?: boolean;
  notes?: string;
  imgUrl?: string;
}

// Pity thresholds (guaranteed legendary pull) by shard type
export const PITY_THRESHOLD: Record<ShardType, number> = {
  Ancient: 200,
  Void:    200,
  Sacred:  12,
  Prism:   400,
};
