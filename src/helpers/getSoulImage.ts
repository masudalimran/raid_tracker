const SOUL_IMAGE_FILE: Record<string, string> = {
  mortal: "mortal_soulstone.jpeg",
  immortal: "immortal_soulstone.jpeg",
  eternal: "eternal_soulstone.jpeg",
};

/** Art asset path for a soulstone tier key (case-insensitive); undefined for unknown tiers. */
export function getSoulImagePath(soulKey: string): string | undefined {
  const file = SOUL_IMAGE_FILE[soulKey.toLowerCase()];
  return file ? `/img/souls/${file}` : undefined;
}
