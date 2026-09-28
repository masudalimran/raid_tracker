export interface ShardTier {
  key: string;
  label: string;
  border: string;
}

// Shared across shard-based event calculators (Summon Rush, Path Event, …) —
// same five shard types, just different point values per event.
export const SHARD_TIERS: ShardTier[] = [
  { key: "mystery", label: "Mystery Shard", border: "border-pink-400" },
  { key: "ancient", label: "Ancient Shard", border: "border-amber-500" },
  { key: "void",    label: "Void Shard",    border: "border-purple-600" },
  { key: "primal",  label: "Primal Shard",  border: "border-rose-600" },
  { key: "sacred",  label: "Sacred Shard",  border: "border-yellow-400" },
];
