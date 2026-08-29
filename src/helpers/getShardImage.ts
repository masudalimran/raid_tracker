const SHARD_IMAGE_FILE: Record<string, string> = {
  mystery: "mystery.webp",
  ancient: "ancient.webp",
  void:    "void.webp",
  primal:  "primal.jpg",
  sacred:  "sacred.webp",
  prism:   "prism.jpg",
};

/** Art asset path for a shard type name (case-insensitive); undefined for types with no art yet. */
export function getShardImagePath(shardName: string): string | undefined {
  const file = SHARD_IMAGE_FILE[shardName.toLowerCase()];
  return file ? `/img/shards/${file}` : undefined;
}
