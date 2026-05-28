import type { IShardPull, ShardType } from "../models/IShard";

const STORAGE_KEY = "shard_pull_log";

export function loadShardPulls(): IShardPull[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as IShardPull[];
  } catch {
    return [];
  }
}

function savePulls(pulls: IShardPull[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pulls));
}

export function addShardPull(pull: Omit<IShardPull, "id">): IShardPull {
  const entry: IShardPull = { ...pull, id: crypto.randomUUID() };
  const pulls = loadShardPulls();
  pulls.unshift(entry); // newest first
  savePulls(pulls);
  return entry;
}

export function deleteShardPull(id: string): void {
  savePulls(loadShardPulls().filter((p) => p.id !== id));
}

export function clearAllPulls(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Pity counter: how many non-legendary pulls since last legendary for this shard type
export function getPityCount(pulls: IShardPull[], shardType: ShardType): number {
  const filtered = pulls.filter((p) => p.shardType === shardType);
  let count = 0;
  for (const pull of filtered) {
    if (pull.rarity === "Legendary" || pull.rarity === "Mythical") break;
    count++;
  }
  return count;
}

export interface ShardStats {
  total: number;
  legendary: number;
  epic: number;
  rare: number;
  pityCount: number;
  legendaryRate: string;
}

export function getShardStats(pulls: IShardPull[], shardType: ShardType): ShardStats {
  const filtered = pulls.filter((p) => p.shardType === shardType);
  const total     = filtered.length;
  const legendary = filtered.filter((p) => p.rarity === "Legendary" || p.rarity === "Mythical").length;
  const epic      = filtered.filter((p) => p.rarity === "Epic").length;
  const rare      = filtered.filter((p) => p.rarity === "Rare").length;
  const pityCount = getPityCount(pulls, shardType);
  const legendaryRate = total > 0 ? ((legendary / total) * 100).toFixed(2) : "0.00";
  return { total, legendary, epic, rare, pityCount, legendaryRate };
}
