export const ShardType = {
  ANCIENT:  "Ancient",
  VOID:     "Void",
  SACRED:   "Sacred",
  PRISM:    "Prism",
  PRIMAL:   "Primal",
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
  notes?: string;
  imgUrl?: string;
  rsl_account_id?: string;
}

// Pity thresholds (guaranteed legendary+ pull) by shard type
export const PITY_THRESHOLD: Record<ShardType, number> = {
  Ancient: 200,
  Void:    200,
  Sacred:  12,
  Prism:   400,
  Primal:  75,
};

// Secondary mercy — only Ancient/Void guarantee an Epic+ within this many
// pulls; the other shard types have no separate Epic-tier pity.
export const EPIC_PITY_THRESHOLD: Partial<Record<ShardType, number>> = {
  Ancient: 20,
  Void:    20,
};

// Third mercy tier — only Primal guarantees a Mythical specifically, on a
// longer, independent counter from its Legendary+ pity above. Sacred and
// Prism have no separate Epic or Mythical mercy at all.
export const MYTHICAL_PITY_THRESHOLD: Partial<Record<ShardType, number>> = {
  Primal: 200,
};
