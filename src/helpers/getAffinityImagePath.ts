import { ChampionAffinity } from "../models/ChampionAffinity";

const NAME_TO_AFFINITY: Record<string, string> = {
  Spirit: ChampionAffinity.SPIRIT,
  Force: ChampionAffinity.FORCE,
  Magic: ChampionAffinity.MAGIC,
  Void: ChampionAffinity.VOID,
};

/** Accepts either a plain affinity name ("Spirit", from tier-list data) or an already-resolved
 * ChampionAffinity image path (from IChampion), and always returns the image path. */
export function getAffinityImagePath(affinity: string): string {
  return NAME_TO_AFFINITY[affinity] ?? affinity;
}
