import type IBlessing from "../models/IBlessing";
import { BlessingGroup } from "../models/IBlessing";
import { ChampionRarity } from "../models/ChampionRarity";

// Every blessing's `id` matches its image filename (no extension) in
// /public/img/blessings/ — see getBlessingImage.ts.
export const BLESSINGS: IBlessing[] = [
  { id: "Indomitable_Spirit", name: "Indomitable Spirit", rarity: ChampionRarity.RARE, group: BlessingGroup.LIGHT, description: "Chance to block Stun, Sleep, or Fear debuffs whenever an enemy tries to place them (1-turn cooldown)." },
  { id: "Miracle_Heal", name: "Miracle Heal", rarity: ChampionRarity.RARE, group: BlessingGroup.LIGHT, description: "Chance to restore a portion of destroyed MAX HP whenever this champion heals themselves or an ally." },
  { id: "Iron_Will", name: "Iron Will", rarity: ChampionRarity.EPIC, group: BlessingGroup.LIGHT, description: "Decreases damage received based on the number of debuffs on this champion (excludes Poison/HP Burn/Bomb)." },
  { id: "Heavencast", name: "Heavencast", rarity: ChampionRarity.EPIC, group: BlessingGroup.LIGHT, description: "Increases damage dealt based on the number of buffs on this champion." },
  { id: "Intimidating_Presence", name: "Intimidating Presence", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.LIGHT, description: "Strengthens your team's Aura and weakens the enemy team's Aura." },
  { id: "Lightning_Cage", name: "Lightning Cage", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.LIGHT, description: "Gains Lightning Orb stacks when enemies get buffed or fill Turn Meter; stacks protect a buff from removal, then deal bonus HP-based damage at 3 stacks." },

  { id: "Dark_Resolve", name: "Dark Resolve", rarity: ChampionRarity.RARE, group: BlessingGroup.DARK, description: "Increases damage dealt based on the number of dead allies (1-turn cooldown, excludes Poison/HP Burn/Bomb)." },
  { id: "Phantom_Touch", name: "Phantom Touch", rarity: ChampionRarity.RARE, group: BlessingGroup.DARK, description: "Chance to inflict bonus ATK-based damage on one enemy when attacking (1-turn cooldown)." },
  { id: "Cruelty", name: "Cruelty", rarity: ChampionRarity.EPIC, group: BlessingGroup.DARK, description: "Each hit decreases the target's DEF until the end of the Round, up to a cap." },
  { id: "Lethal_Dose", name: "Lethal Dose", rarity: ChampionRarity.EPIC, group: BlessingGroup.DARK, description: "Increases damage enemies take from this champion's Poison debuffs in Arena." },
  { id: "Temporal_Chains", name: "Temporal Chains", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.DARK, description: "Decreases each enemy's SPD based on their active buffs (excluding round-start buffs)." },
  { id: "Ward_of_the_Fallen", name: "Ward of the Fallen", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.DARK, description: "Starts each Round with Bone Armor stacks that reduce damage from a single hit, then disappear." },

  { id: "Heros_Soul", name: "Hero's Soul", rarity: ChampionRarity.RARE, group: BlessingGroup.WAR, description: "Increases damage dealt to Bosses and their minions based on the number of living enemies." },
  { id: "Faultless_Defense", name: "Faultless Defense", rarity: ChampionRarity.RARE, group: BlessingGroup.WAR, description: "Reflects a portion of damage back to attackers who hit allies under this champion's Increase DEF buff." },
  { id: "Commanding_Presence", name: "Commanding Presence", rarity: ChampionRarity.EPIC, group: BlessingGroup.WAR, description: "Strengthens your team's Aura." },
  { id: "Chainbreaker", name: "Chainbreaker", rarity: ChampionRarity.EPIC, group: BlessingGroup.WAR, description: "Chance to remove Stun/Freeze/Sleep/Provoke/Fear/True Fear/Petrification at the start of this champion's turn." },
  { id: "Life_Harvest", name: "Life Harvest", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.WAR, description: "Destroys a portion of a revived enemy's MAX HP whenever they are revived." },
  { id: "Soul_Reap", name: "Soul Reap", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.WAR, description: "When an attack drops an enemy's HP below a threshold, a Reaper deals bonus true damage equal to their remaining HP." },

  { id: "Emergency_Heal", name: "Emergency Heal", rarity: ChampionRarity.RARE, group: BlessingGroup.CHAOS, description: "Heals this champion when a Shield buff on them expires, is removed, or is broken (1-turn cooldown)." },
  { id: "Survival_Instinct", name: "Survival Instinct", rarity: ChampionRarity.RARE, group: BlessingGroup.CHAOS, description: "Partially fills this champion's Turn Meter whenever a debuff is placed, spread, or transferred onto them." },
  { id: "Crushing_Rend", name: "Crushing Rend", rarity: ChampionRarity.EPIC, group: BlessingGroup.CHAOS, description: "A number of hits each Round ignore a percentage of the target's DEF, scaling with the target's level." },
  { id: "Incinerate", name: "Incinerate", rarity: ChampionRarity.EPIC, group: BlessingGroup.CHAOS, description: "Increases damage dealt by this champion's HP Burn debuffs in Arena." },
  { id: "Polymorph", name: "Polymorph", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.CHAOS, description: "Chance to place a Sheep debuff on enemies who debuff this champion or remove/steal their buffs." },
  { id: "Brimstone", name: "Brimstone", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.CHAOS, description: "Attacks have a chance to place a Smite debuff that detonates for HP-based damage when the target uses an active skill." },

  { id: "Natures_Bounty", name: "Nature's Bounty", rarity: ChampionRarity.RARE, group: BlessingGroup.HARMONY, description: "Chance to place a stronger version of any debuff this champion applies." },
  { id: "Nourish", name: "Nourish", rarity: ChampionRarity.RARE, group: BlessingGroup.HARMONY, description: "Increases the heal value of this champion's Continuous Heal buffs and restores a portion of destroyed MAX HP." },
  { id: "Neutralize", name: "Neutralize", rarity: ChampionRarity.EPIC, group: BlessingGroup.HARMONY, description: "Chance to place debuffs on weak hits against enemies under a Poison Cloud buff (Hydra)." },
  { id: "Natures_Wrath", name: "Nature's Wrath", rarity: ChampionRarity.EPIC, group: BlessingGroup.HARMONY, description: "Increases damage dealt for every debuff this champion successfully places." },
  { id: "Cracking_Roots", name: "Cracking Roots", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.HARMONY, description: "Increases damage dealt to Stone Skin HP." },
  { id: "Harmonic_Impulse", name: "Harmonic Impulse", rarity: ChampionRarity.LEGENDARY, group: BlessingGroup.HARMONY, description: "Fills this champion's Turn Meter and reduces the cooldown of the skill they attempted to use whenever they lose a turn to Fear/True Fear." },
];

export const BLESSINGS_BY_ID: Record<string, IBlessing> = Object.fromEntries(
  BLESSINGS.map((b) => [b.id, b]),
);

export function getBlessingById(id: string): IBlessing | undefined {
  return BLESSINGS_BY_ID[id];
}
