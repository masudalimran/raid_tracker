export type EffectCategory = "buff" | "debuff" | "enemy" | "mechanic";

export interface EffectDescription {
  name: string;
  category: EffectCategory;
  /** Which boss/source this effect belongs to — only set for category "enemy". */
  group?: string;
  description: string;
  /** Public path to the effect's icon — omitted for effects with no matching art asset. */
  icon?: string;
}

// Sourced from https://ayumilove.net/raid-shadow-legends-buffs-debuffs-guide/
// (buffs/debuffs) and https://ayumilove.net/raid-shadow-legends-ally-join-attack-skill-champions/
// (Ally Attack) — kept verbatim rather than paraphrased.

export const BUFF_DESCRIPTIONS: EffectDescription[] = [
  {
    name: "Ally Protection",
    category: "buff",
    icon: "/img/buffs/Ally Protector.png",
    description: "The Caster Champion takes 25/50% of direct damage inflicted upon the Target Champion. Self-inflicted damage and Poison do not trigger this effect. Each Champion uses their respective DEF values for mitigating damage.",
  },
  {
    name: "Block Damage",
    category: "buff",
    icon: "/img/buffs/Block Damage.png",
    description: "Makes the Champion immune to all forms of damage.",
  },
  {
    name: "Block Debuffs",
    category: "buff",
    icon: "/img/buffs/Block Debuffs.png",
    description: "While this buff is active, the Champion is immune to all debuffs. Instant negative effect such as Decrease Turn Meter are not affected and work as normal.",
  },
  {
    name: "Bone Armor",
    category: "buff",
    icon: "/img/buffs/Bone Armor.png",
    description: "A Champion starts each Round with a number of Bone Armor stacks. Each Bone Armor stack decreases the damage the recipient receives from a single hit, then disappears. A Champion can have a maximum of 3 Bone Armor stacks at one time.",
  },
  {
    name: "Continuous Heal",
    category: "buff",
    icon: "/img/buffs/Continuous Heal.png",
    description: "Heals the target Champion by 7.5/15% of their MAX HP at the beginning of their Turn.",
  },
  {
    name: "Counterattack",
    category: "buff",
    icon: "/img/buffs/Couterattack.png",
    description: "When attacked, the Champion with this buff strikes back at their attacker using their Default Skill. This attack deals 75% of the normal Default Skill damage. Can only counterattack once when attacked with a Multi-hit Skill. Does not counterattack in response to the enemy's own counterattack. Does not count as a Turn. If the Champion who has Counterattack buff and has default skill that grants Extra Turn upon killing an enemy (e.g. Relickeeper), that Champion will not gain Extra Turn during the Counterattack session.",
  },
  {
    name: "Fervor",
    category: "buff",
    icon: "/img/buffs/Fervor.png",
    description: "Increases damage inflicted by 10% and reduces damage received by 10%.",
  },
  {
    name: "Fortify",
    category: "buff",
    icon: "/img/buffs/Fortify.png",
    description: "Reduces any enemy Ignore DEF effects by 15% or 25%.",
  },
  {
    name: "Goldplated",
    category: "buff",
    icon: "/img/buffs/Goldplated.png",
    description: "The Goldplated buff grants Phrygius the Trovemaster layers of additional HP beyond their MAX HP. Goldplated layers cannot be removed, stolen, or have their duration increased or decreased. When Phrygius receives damage while under Goldplated layers, it is first applied to the Goldplated layers. Each layer of Goldplated can block a certain amount of damage, and is destroyed after receiving that amount of damage. When a Goldplated layer is destroyed, Phrygius will receive damage equal to the value of that Goldplated layer, and other enemies will also receive a portion of that damage. Any surplus damage to a Goldplated layer is dealt directly to Phrygius' HP.",
  },
  {
    name: "Immutable",
    category: "buff",
    icon: "/img/buffs/Immutable.png",
    description: "Prevents any attempt to increase a Champion's skill cooldown. Each stack fully blocks one such attempt, regardless of how many turns would be added, and is then consumed. Immutable has no duration—its stacks cannot be extended, reduced, or spread to allies. If the Champion is immune to cooldown increases, stacks are not consumed; however, if the effect cannot be resisted, one stack is removed. Applying fewer stacks than the Champion currently has will not overwrite the existing total. If stolen, all stacks present are transferred to the thief.",
  },
  {
    name: "Increase ACC",
    category: "buff",
    icon: "/img/buffs/Increase ACC.png",
    description: "Increases the recipient's ACC by 25% or 50%.",
  },
  {
    name: "Increase ATK",
    category: "buff",
    icon: "/img/buffs/Increase ATK.png",
    description: "Increases the Champion's Battle Attack (current Attack value including all modifiers) by 25% or 50%.",
  },
  {
    name: "Increase C.RATE",
    category: "buff",
    icon: "/img/buffs/Increase C Rate.png",
    description: "Increases the Champion's C.RATE by 15% or 30%.",
  },
  {
    name: "Increase C.DMG",
    category: "buff",
    icon: "/img/buffs/Increase C DMG.png",
    description: "Increases the Critical Damage dealt by 15% or 30%.",
  },
  {
    name: "Increase RES",
    category: "buff",
    icon: "/img/buffs/Increase RES.png",
    description: "Increases the Champion's Battle Resistance by 25% or 50%.",
  },
  {
    name: "Increase DEF",
    category: "buff",
    icon: "/img/buffs/Increase DEF.png",
    description: "Increases the Champion's Battle Defense by 30% or 60%.",
  },
  {
    name: "Increase Speed",
    category: "buff",
    icon: "/img/buffs/Increase SPD.png",
    description: "Increases the Champion's Battle Speed by 15% or 30%.",
  },
  {
    name: "Intercept",
    category: "buff",
    icon: "/img/buffs/Intercept.png",
    description: "The Intercept buff is a powerful mechanic that blocks any attempt to apply crowd control debuffs, even if the debuff specifies it cannot be blocked. This includes effects like Stun, Sleep, Freeze, Prove, Fear, True Fear, Petrification, and Sheep debuffs. Each stack of Intercept negates one attempt to apply such a debuff, after which the stack is consumed. A Champion can have multiple stacks of Intercept, but the buff itself has no duration, meaning it cannot be extended, reduced, or transferred to allies. When combined with Block Debuffs, an Intercept stack is not consumed if the debuff could have been blocked anyway, but is always consumed if the debuff cannot be blocked. If a Champion already has Intercept stacks and gains another Intercept buff with fewer stacks, their current stack count remains unchanged. If a Champion steals the Intercept buff from an enemy, they gain the exact number of stacks the original Champion possessed at the time of theft.",
  },
  {
    name: "Lightning Orb",
    category: "buff",
    icon: "/img/buffs/Lightning Orb.png",
    description: "Whenever an enemy receives a buff or has their Turn Meter filled, places one Lightning Orb stack on this Champion. When activated, a Lightning Orb stack randomly protects one other active buff from being removed, stolen, or transferred. After activation, the Lightning Orb stack disappears. A Champion can have a maximum of 3 Lightning Orb stacks at one time. Whenever a Champion with 3 Lightning Orb stacks hits enemy targets, inflicts Bonus Damage to them based on their MAX HP. Bonus Damage can occur on each hit of a Skill, but does not count as an extra hit. After the Bonus Damage is applied, all active Lightning Orb stacks are removed from this Champion.",
  },
  {
    name: "Magma Shield",
    category: "buff",
    icon: "/img/buffs/Magma Shield.png",
    description: "The Champion's HP Bar is reinforced with a Magma Shield for the indicated number of turns. Damage is calculated as normal, but is first applied to the Magma Shield (unless the attack is stated to ignore Shields). When the Magma Shield buff expires, or the value of the Magma Shield reaches 0, the buff is removed and any further damage is applied as normal. When damage is dealt to a Magma Shield, it is first applied to the Magma Shield, then an equal amount of damage is also dealt back to the attacker.",
  },
  {
    name: "Reflect Damage",
    category: "buff",
    icon: "/img/buffs/Reflect Damage.png",
    description: "Any Champion attack a target with this buff will sustain 15/30% of the damage they inflicted with the attack.",
  },
  {
    name: "Revive On Death",
    category: "buff",
    icon: "/img/buffs/Revive On Death.png",
    description: "If a Champion with this buff dies, he or she will immediately be revived with 30% HP and 0% Turn Meter.",
  },
  {
    name: "Shatter",
    category: "buff",
    icon: "/img/buffs/Shatter.png",
    description: "Increases a Champion's Ignore DEF effects by 7.5% or 15%.",
  },
  {
    name: "Shield",
    category: "buff",
    icon: "/img/buffs/Shield.png",
    description: "The Champion's HP bar is reinforced for X Turns with a Shield effect. Damage is calculated normally but is first applied to the Shield (unless the attack ignores Shields, which is stated in the Skill description). When the buff expires or Shield value reaches 0, the Shield is removed and further damage applies as normal. Note: damage dealt to the shield does not count as damage dealt to the Champion, so effects such as Lifesteal do not benefit from it.",
  },
  {
    name: "Stone Skin",
    category: "buff",
    icon: "/img/buffs/Stone Skin.png",
    description: "Stone Skin buff decreases the damage (except the damage received from Bombs and HP Burn), removes all debuffs except Bombs and HP Burn, gives Immunity to all debuffs except Bombs and HP Burn. Also, it gives additional Stone Skin HP. A Champion with the Stone Skin is immune to the Decrease MAX HP and Decrease Turn Meter Effects.",
  },
  {
    name: "Stormcall",
    category: "buff",
    icon: "/img/buffs/Stormcall.png",
    description: "Each stack of Stormcall increases a Champion's damage by 5%, with a maximum of 5 stacks allowed at once. When a Champion attacks with the full 5 stacks, they apply an irresistible Stun debuff to the target and all Stormcall stacks are immediately removed.",
  },
  {
    name: "Strengthen",
    category: "buff",
    icon: "/img/buffs/Strengthen.png",
    description: "Decreases incoming damage by 15% or 25%.",
  },
  {
    name: "Taunt",
    category: "buff",
    icon: "/img/buffs/Taunt.png",
    description: "Taunt is a buff that forces enemies to attack the Taunting Champion. It's great against single-target nukers in both PvP and PvE, champions with crowd control debuffs on their basic abilities, champions who have Evil Eye mastery, or bosses with powerful single-target attacks. The Taunt buff can be stolen, removed, and decrease its duration. Petrification on the Taunting champions will also remove this buff. However, you cannot spread Taunt debuff and increase its duration. Provoke has priority over Taunt. A provoked champion will target the Champion who placed Provoke on them. If there are 2 champions with a Taunt buff, then the enemy can target either one. However, if one of them have Veiled buff, the one without Veil is targeted first.",
  },
  {
    name: "Total Guard",
    category: "buff",
    icon: "/img/buffs/Total Guard.png",
    description: "The Total Guard buff will block any single instance of damage and all status effects a Champion receives from an enemy skill. A Champion can receive multiple stacks of the Total Guard buff. Each Total Guard stack will block a single instance of damage from an enemy Champion's skill. It will also block any associated effects, such as debuffs, including guaranteed and unresistable debuffs, destroy MAX HP effects, equalize HP effects, swap HP effects, Debuff Spread effects, decrease or equalize Turn Meter effects, instant activation of Poison or HP Burn debuffs, and Polymorph debuffs. As long as a Champion has at least one Total Guard stack, they will be immune to all negative effects except Increase Cooldown, even from skills that do not inflict damage. A Champion will lose a stack of Total Guard whenever they would take damage from another Champion's skill, including damage taken via Ally Protection buffs, Reflect Damage buffs, and passive skills that share or reflect damage — but not from Masteries, Blessings, or Relics. If a Champion is under both Total Guard and Block Damage when they receive damage from an enemy Champion's skill, they will lose a stack of Total Guard. All Bosses will ignore Total Guard.",
  },
  {
    name: "Unkillable",
    category: "buff",
    icon: "/img/buffs/Unkillable.png",
    description: "The Champion with this buff cannot fall below 1 HP for the entirety of its duration.",
  },
  {
    name: "Veil",
    category: "buff",
    icon: "/img/buffs/Veil.png",
    description: "Champions under [Veil] buffs are unable to be targeted by the enemy team. However, Champions under [Veil] can still be hit with AoE attacks or attacks that hit random enemies. Champions will lose their [Veil] buff when they attack an enemy Champion, but can still use non-damaging skills (buffing allies, or applying debuffs that deal no damage) without losing it. If all Champions on a team are under either [Veil] or [Perfect Veil], the buffs become ineffective and the enemy can target normally; the same applies if only one Champion remains under Veil/Perfect Veil. Veil reduces incoming AoE damage by 7.5%. Perfect Veil is a more powerful version that works the same way except the buff is not lost after attacking, and it reduces incoming AoE damage by 15%.",
  },
];

export const DEBUFF_DESCRIPTIONS: EffectDescription[] = [
  {
    name: "Berserk",
    category: "debuff",
    icon: "/img/debuffs/Berserk.png",
    description: "Increases the damage inflicted and damage received by 50%.",
  },
  {
    name: "Block Active Skills",
    category: "debuff",
    icon: "/img/debuffs/Block Active Skills.png",
    description: "Prevents the Champion with debuff from using Active Skills other than their Default Skill for the duration of the debuff. Skill Cooldown of the affected Champion refreshes as normal.",
  },
  {
    name: "Block Passive Skills",
    category: "debuff",
    icon: "/img/debuffs/Block Passive Skills.png",
    description: "Block Passive Skills debuff blocks activation of Champion's passive skills. This debuff cannot block passive skills which are marked as unblockable.",
  },
  {
    name: "Block Buffs",
    category: "debuff",
    icon: "/img/debuffs/Block Buffs.png",
    description: "All buffs that are applied to the Champion with this debuff are automatically blocked and have no effect.",
  },
  {
    name: "Block Revive",
    category: "debuff",
    icon: "/img/debuffs/BlockRevive.png",
    description: "This debuff blocks Revive effects. The Block Revive debuff cannot be blocked. Valid throughout the battle.",
  },
  {
    name: "Bomb",
    category: "debuff",
    icon: "/img/debuffs/Bomb.png",
    description: "When this debuff expires, the affected Champion suffers direct damage that ignores their DEF value. The damage inflicted by the bomb scales in accordance with the Stat indicated in the Skill description.",
  },
  {
    name: "Deathbrand",
    category: "debuff",
    icon: "/img/debuffs/Deathbrand.png",
    description: "Champions under a Deathbrand debuff will receive the Block Revive debuff when killed.",
  },
  {
    name: "Decrease ACC",
    category: "debuff",
    icon: "/img/debuffs/Decrease ACC.png",
    description: "Reduces the Champion's Battle Accuracy by 25/50%.",
  },
  {
    name: "Decrease ATK",
    category: "debuff",
    icon: "/img/debuffs/Decrease ATK.png",
    description: "Decreases the Champion's Battle Attack by 25/50%.",
  },
  {
    name: "Decrease C.DMG",
    category: "debuff",
    icon: "/img/debuffs/Decrease C DMG.png",
    description: "Decrease Critical Damage is a debuff that decreases the Critical Damage inflicted by the recipient. Can decrease the damage inflicted by 15% or 30%.",
  },
  {
    name: "Decrease C.RATE",
    category: "debuff",
    icon: "/img/debuffs/Decrease C Rate.png",
    description: "Decrease Critical Rate is a debuff that decreases the Critical Rate of the recipient. Can decrease Critical Rate by 15% or 30%.",
  },
  {
    name: "Decrease DEF",
    category: "debuff",
    icon: "/img/debuffs/Decrease DEF.png",
    description: "Decreases the Champion's Battle Defense by 30/60%.",
  },
  {
    name: "Decrease RES",
    category: "debuff",
    icon: "/img/debuffs/Decrease RES.png",
    description: "Decrease Resistance debuff decreases the Champion's Battle Resistance by 25% or 50%. This allows your debuffers to inflict debuff easily with lesser accuracy required.",
  },
  {
    name: "Decrease SPD",
    category: "debuff",
    icon: "/img/debuffs/Decrease SPD.png",
    description: "Decreases the Champion's Battle Speed by 15/30%.",
  },
  {
    name: "Enfeeble",
    category: "debuff",
    icon: "/img/debuffs/Enfeeble.png",
    description: "Champions under an Enfeeble debuff can only land weak hits, unless stated otherwise in a skill description.",
  },
  {
    name: "Ensnare",
    category: "debuff",
    icon: "/img/debuffs/Ensnare.png",
    description: "Any Turn Meter increase effects received by a Champion with the Ensnare debuff will be reduced by 50% or 100%.",
  },
  {
    name: "Entangle",
    category: "debuff",
    icon: "/img/debuffs/Entangle.png",
    description: "A Champion under an Entangle debuff will not receive any positive effects from their allies, including buffs, and will not have their Turn Meter passively increased. When placed, a Champion receiving the Entangle debuff will have all of their buffs removed, but can still receive additional debuffs. The Entangle debuff has no duration, and therefore cannot have its duration increased or decreased, nor can it be spread to other Champions. You can only remove an Entangle debuff by actively filling the Champion's Turn Meter to 100%.",
  },
  {
    name: "Fatigue",
    category: "debuff",
    icon: "/img/debuffs/Fatigue.png",
    description: "Champions under a Fatigue debuff will receive a Sleep debuff for 1 turn after using an active skill. If a champion with a Fatigue debuff uses a skill that removes debuffs, the Fatigue debuff will be removed and the Sleep debuff will not be placed.",
  },
  {
    name: "Fear",
    category: "debuff",
    icon: "/img/debuffs/Fear.png",
    description: "Fear gives a 50% chance for a Champion's Skill to misfire. When it triggers, the Skill does not activate and the Champion immediately forfeits their turn. True Fear is similar but more punishing — if the Skill fails, the attempted Skill is also pushed onto cooldown in addition to losing the turn.",
  },
  {
    name: "Freeze",
    category: "debuff",
    icon: "/img/debuffs/Freeze.png",
    description: "The Champion with this debuff is unable to act X Turns. Cooldowns are not refreshed while [Freeze] is active. The Champion only receives 75% of incoming damage.",
  },
  {
    name: "Heal Reduction",
    category: "debuff",
    icon: "/img/debuffs/Heal Reduction.png",
    description: "Any healing received by the Champion with this debuff is reduced by 50/100%.",
  },
  {
    name: "Hex",
    category: "debuff",
    icon: "/img/debuffs/Hex.png",
    description: "Champions under Hex debuffs take damage whenever their allies do. The damage from Hex debuffs ignores Champions' DEF. The original targets all take full damage. Champions under Hex debuffs take 2% of AoE damage inflicted on their allies, and 10% of single-target damage inflicted on their allies. Champions under Hex debuffs only take extra damage from direct attacks on their allies, not lasting effects (like buffs or debuffs).",
  },
  {
    name: "HP Burn",
    category: "debuff",
    icon: "/img/debuffs/HP Burn.png",
    description: "While the debuff is active and at the start of the affected Champion's turn, they and all their allies take damage equal to 3% of their respective MAX HP. There can be only one [HP Burn] debuff active on a Champion at a time.",
  },
  {
    name: "Hunter's Gaze",
    category: "debuff",
    icon: "/img/debuffs/Hunters Gaze.png",
    description: "Damage dealt to a Champion under the Hunter's Gaze debuff cannot be decreased, blocked, redirected, or transferred, but this only applies to damage directly inflicted by skills, excluding debuffs, passives, Masteries, or Blessings. This damage bypasses protective effects such as Unkillable, Block Damage, Increase DEF, Strengthen, Ally Protection, Veil, Perfect Veil, and Shield buffs. However, Champions can still Evade attacks while under the Hunter's Gaze debuff.",
  },
  {
    name: "Infest",
    category: "debuff",
    icon: "/img/debuffs/Infest.png",
    description: "When an enemy afflicted by the Infest debuff is slain, all remaining enemies take pure damage equal to 50% of the defeated enemy's MAX HP. This damage cannot critically strike. Against Bosses or their minions, the pure damage is capped at 10% of their MAX HP.",
  },
  {
    name: "Ironbrand",
    category: "debuff",
    icon: "/img/debuffs/Ironbrand.png",
    description: "The Ironbrand debuff does nothing on its own, but it will increase the damage dealt by the Iron Twins' Doomsday Machine skill. Damage from this skill is increased according to the duration of any Ironbrand debuffs currently active on each Champion. The higher the duration of an Ironbrand debuff, the greater the damage that Doomsday Machine will do. Ironbrand cannot be blocked or removed, but it can be resisted.",
  },
  {
    name: "Leech",
    category: "debuff",
    icon: "/img/debuffs/Leech.png",
    description: "Any Champion that attacks a Champion with this debuff heals for 18% of inflicted damage.",
  },
  {
    name: "Necrosis",
    category: "debuff",
    icon: "/img/debuffs/Necrosis.png",
    description: "The Necrosis mechanic is a debuff that grows stronger with each enemy Champion defeated. When an enemy dies, a single Necrosis stack is applied to all surviving enemies. Each subsequent death adds another stack to the living enemies, and this process continues throughout the battle. At the start of their turn, each Champion takes damage equal to 5% of their maximum HP for every Necrosis stack they possess.",
  },
  {
    name: "Nullify",
    category: "debuff",
    icon: "/img/debuffs/Nullify.png",
    description: "Champions under the Nullify debuff cannot have their skills activated, participate in Ally Attacks, be granted an Extra Turn or an Instant Turn, have their skills' cooldowns decreased, have their Shield's value increased, have their destroyed HP restored, have their HP swapped, Evade enemy effects or skills, have their Turn Meter equalized, or have their HP balanced.",
  },
  {
    name: "Petrification",
    category: "debuff",
    icon: "/img/debuffs/Petrification.png",
    description: "A Champion under a Petrification debuff will have all of their buffs removed, and be unable to take their next turn. When under a Petrification debuff, a Champion will be unable to receive buffs, and is susceptible to receiving more debuffs. Instant effects do not work, except for Remove Debuff. They only receive 40% of incoming damage, but Bomb damage is increased by 300%.",
  },
  {
    name: "Poison",
    category: "debuff",
    icon: "/img/debuffs/Poison.png",
    description: "Damages the target Champion by 2.5/5% of their MAX HP at the beginning of their Turn. This damage is not affected by other effects and only scales in accordance with the Target's MAX HP.",
  },
  {
    name: "Poison Sensitivity",
    category: "debuff",
    icon: "/img/debuffs/Poison Sensitivity.png",
    description: "Poison Sensitivity increases the damage taken from the Poison debuff by the recipient. Can increase the damage taken by 25% or 50%.",
  },
  {
    name: "Provoke",
    category: "debuff",
    icon: "/img/debuffs/Provoke.png",
    description: "The Champion with this debuff can only attack the Champion that applied it for X Turns, using their Default Skill.",
  },
  {
    name: "Sheep",
    category: "debuff",
    icon: "/img/debuffs/Sheep.png",
    description: "Champions under Sheep debuffs lose access to their normal skills, and can only use the Sheep skill: Attacks 1 enemy. Any ally Sheep will join this attack. 50% chance to remove Sheep after attacking. When expired or defeated, the Champion returns with 50% HP.",
  },
  {
    name: "Siphon",
    category: "debuff",
    icon: "/img/debuffs/Siphon.png",
    description: "A Champion under a Siphon debuff will have 5% of their stat values siphoned by the debuff producer, except Ignore DEF. Each time the debuff producer takes a turn, an additional 5% of the stat values will be stolen, stacking up to 50%. For example, a Champion with 1000 ATK under Siphon will initially have their ATK decreased to 950 and the debuff producer's ATK will be increased by 5%. The Siphon debuff cannot be transferred, spread, or have its duration increased or decreased. It can be removed.",
  },
  {
    name: "Sleep",
    category: "debuff",
    icon: "/img/debuffs/Sleep.png",
    description: "The Champion with this debuff is unable to act X Turns. Cooldowns are not refreshed while [Sleep] is active. Any incoming damage received automatically removes [Sleep].",
  },
  {
    name: "Seal",
    category: "debuff",
    icon: "/img/debuffs/Seal.png",
    description: "There are two versions of this debuff: Seal and Master Seal. Seal blocks effects from Gear Sets and Masteries (except stat boosts). Master Seal additionally blocks Blessings (except stat boosts). Effects activated before placement are not blocked.",
  },
  {
    name: "Smite",
    category: "debuff",
    icon: "/img/debuffs/Smite.png",
    description: "Champions under the Smite debuff will be hit by a meteorite when they use an Active Skill. The meteorite inflicts damage equal to 25% of their MAX HP, and 5% of all other enemy Champions' MAX HP. Only one Smite debuff can be active per team at any point.",
  },
  {
    name: "Stun",
    category: "debuff",
    icon: "/img/debuffs/Stun.png",
    description: "The Champion with this debuff is unable to act X Turns. Cooldowns are not refreshed while [Stun] is active.",
  },
  {
    name: "Weaken",
    category: "debuff",
    icon: "/img/debuffs/Weaken.png",
    description: "Increases damage received by the Target Champion by 15/25%.",
  },
];

export const ENEMY_EFFECT_DESCRIPTIONS: EffectDescription[] = [
  {
    name: "Eclipse",
    category: "enemy",
    group: "Amius the Lunar Archon",
    icon: "/img/buffs/Eclipse.png",
    description: "Only Amius the Lunar Archon can place this buff on himself. When placed, Amius will transform into his Alternate Form. When the buff expires, Amius will transform back to his Base Form.",
  },
  {
    name: "Mark of the Hydra",
    category: "enemy",
    group: "Hydra",
    description: "Marks one Champion who will be affected by the Devouring Skill. This effect can't be removed, and its duration can't be decreased. It cannot blocked or resisted, and ignores Perfect Veil and Veil buffs. The Mark of the Hydra is placed irrespective of the number of debuffs on the Champion.",
  },
  {
    name: "Digesting",
    category: "enemy",
    group: "Hydra",
    description: "At the start of a Hydra battle, one Champion will receive a Mark of the Hydra debuff with a 20-turn countdown. Once the countdown expires, the marked Champion will be devoured by the Head that moves next. After devouring the marked Champion, the Hydra Head will begin digesting them and a 5-turn countdown will begin. If enough damage is dealt to the digesting Hydra Head before the countdown ends, the devoured Champion will be set free and return to the battle. If the countdown expires, the Champion will be consumed and cannot be revived or return to the battle.",
  },
  {
    name: "Life Barrier",
    category: "enemy",
    group: "Hydra",
    icon: "/img/buffs/Life Barrier.png",
    description: "This buff gives additional Life Barrier HP apart from Champions HP. It has the highest priority of all buffs and will always work for the indicated number of turns. Life Barrier buff cannot be removed, stolen, or otherwise affected by buff manipulation skills. Skills that take into account the size of the Shield on the target for damage consider Life Barrier as a Shield. The buff is placed over Stone Skin and Digestion Hydra Effect — the Life Barrier must be removed first to inflict damage on the other effects.",
  },
  {
    name: "Poison Cloud",
    category: "enemy",
    group: "Hydra",
    icon: "/img/buffs/Poison Cloud.png",
    description: "Poison Cloud buff blocks damage from Poison debuffs. If a Champion got an HP Burn debuff before the Poison Cloud was applied, then the effects of the Poison Cloud won't work, but the buff itself will not be removed. It's not affected by the Steal Buff, Remove Buff, Spread Buff, Increase Buff Duration, Decrease Buff Duration effects.",
  },
  {
    name: "Serpent's Will",
    category: "enemy",
    group: "Hydra",
    icon: "/img/buffs/Serpents Will.png",
    description: "Serpent's Will buff reduces all damage a new Head takes by 75%. It starts working once the dead Head is transformed into a new Head and is active until the new Head makes its first move. This buff can't be removed, stolen, or spread. Also, its duration can't be increased or decreased.",
  },
  {
    name: "Vengeance",
    category: "enemy",
    group: "Hydra",
    icon: "/img/buffs/Vengence.png",
    description: "Increases the damage inflicted by the Head of Wrath by 300%. It is activated automatically once the Head of Wrath receives 15 hits. The hits are shown on the Vengeance counter. The Head of Wrath deals increased damage twice: right after the buff was activated and on its next turn. This buff can't be removed, stolen, or spread. Also, its duration can't be increased or decreased.",
  },
  {
    name: "Decapitated",
    category: "enemy",
    group: "Hydra",
    icon: "/img/debuffs/Decapitated.png",
    description: "Increases damage taken by the Head that was cut off by 200%. It is active for as long as the Head is dead. Decapitated debuff can't be removed; its duration can't be increased or decreased.",
  },
  {
    name: "Pain Link",
    category: "enemy",
    group: "Hydra",
    icon: "/img/debuffs/Pain Link.png",
    description: "The Pain Link debuff causes the affected Champion to receive 15% of all damage received by the Head of Suffering. The Head of Suffering receives 100% of the damage inflicted to it. The Pain Link debuff can be blocked or removed and can have its duration increased or decreased. Receiving a Pain Link debuff will awaken Champions under a Sleep debuff. If a Champion is under both a Pain Link debuff and a Block Damage buff, they won't receive any damage from the Pain Link debuff.",
  },
  {
    name: "Eternal Rage",
    category: "enemy",
    group: "Eternal Dragon",
    icon: "/img/buffs/Eternal Rage.png",
    description: "The Eternal Rage buff increases Iragoth's SPD and causes Iragoth to ignore Unkillable, Block Damage, Shield buffs and ignore 50% of the target's DEF when attacking.",
  },
  {
    name: "Rage",
    category: "enemy",
    group: "Minotaur",
    icon: "/img/buffs/Rage.png",
    description: "While active, this buff increases the damage the Minotaur deals by 400%.",
  },
  {
    name: "Dazed",
    category: "enemy",
    group: "Minotaur",
    icon: "/img/debuffs/Dazed.png",
    description: "While active, this debuff increases the damage the Minotaur receives by 200%. The duration of this debuff cannot be increased.",
  },
  {
    name: "Hex (Minotaur)",
    category: "enemy",
    group: "Minotaur",
    icon: "/img/debuffs/Hex.png",
    description: "Minotaur's [Tremor Stomp] Skill deals double damage to Champions with this debuff.",
  },
  {
    name: "Duel",
    category: "enemy",
    group: "Chimera",
    description: "The Duel effect is placed on the producer and their target. While active, the producer can use any skill against the target, while the target is limited to only using their default skill against the producer, similar to Provoke. The producer deals 50% more damage to the target under the Duel effect; Champions not under the Duel effect deal 50% less damage to targets who are in a 'duel'. To end the duel, Champions must deplete the producer's Duel bar (0.5% of the producer's MAX HP). If the producer or their target dies while under the Duel effect, it is also removed. The Duel effect has priority over Taunt, Veil, and Perfect Veil buffs, is placed irrespective of the number of debuffs currently on a target Champion, and is guaranteed — it cannot be removed, resisted, stolen, spread, or blocked.",
  },
  {
    name: "Delay",
    category: "enemy",
    group: "Miscellaneous",
    description: "The Delay effect will prevent a Champion from receiving fatal damage, instead delaying it to their next turn. A Champion under the Delay effect can still be killed by enemies on their turns. If a Champion under the Delay effect receives healing equal to the amount of delayed damage, they will not receive any damage on their next turn; partial healing reduces the delayed damage by that amount. If a Champion does not receive any healing before their next turn, they will receive all of the fatal damage when their next turn starts.",
  },
  {
    name: "Ingest",
    category: "enemy",
    group: "Miscellaneous",
    description: "When summoned to battle, the Mini-Mimic will Ingest the enemy Champion with the highest C.DMG. Whenever the Mimic takes a turn in battle, the Mini-Mimic will deal damage to the Ingested Champion, equal to 25% of their current HP. The Ingested Champion will be freed from the Mini-Mimic when it is defeated, or after 4 turns have passed. While Ingested, a Champion is considered removed from battle — they cannot receive buffs, debuffs, or instant effects, and cannot be selected as a target for a skill. The Ingested state cannot be removed except by defeating the Mini-Mimic, or waiting for 4 turns. When Ingesting a Champion, the Mini-Mimic will ignore Block Debuffs, Veil & Perfect Veil buffs, and Resistance. A Champion can still be Ingested even if they already have 10 debuffs on them. No more than one Mini-Mimic can be present in a battle at any time, and no more than one Champion can be Ingested at a time.",
  },
];

// Not a persisting buff or debuff — an instant, proactive mechanic — but
// grouped with the other "DPS" role effects below since it's commonly used
// the same way when planning a damage-focused team.
export const MECHANIC_DESCRIPTIONS: EffectDescription[] = [
  {
    name: "Ally Attack",
    category: "mechanic",
    icon: "/img/buffs/Couterattack.png",
    description: "Ally Join Attack is a skill that allows other allies to participate in attacking the targeted enemy using their default skill at 75% damage. It's proactive and useful because it concentrates attack on a single enemy without consuming your allies' Turn Meter — similar to Counterattack, but initiated by the player's attack rather than triggered by the enemy.",
  },
];

export const ALL_EFFECT_DESCRIPTIONS: EffectDescription[] = [
  ...BUFF_DESCRIPTIONS,
  ...DEBUFF_DESCRIPTIONS,
  ...ENEMY_EFFECT_DESCRIPTIONS,
  ...MECHANIC_DESCRIPTIONS,
];

// The three DPS-flavored effects called out for their own section on the
// Buffs & Debuffs page — Ally Attack, HP Burn, and Poison are what most
// damage-role team-building revolves around.
export const DPS_EFFECT_NAMES = ["Ally Attack", "HP Burn", "Poison"];

const DESCRIPTION_BY_NAME = new Map(
  ALL_EFFECT_DESCRIPTIONS.map((e) => [e.name, e.description]),
);

/** Looks up an effect's description by its display name (role/buff/debuff name), for tooltips. */
export function getEffectDescription(name: string): string | undefined {
  return DESCRIPTION_BY_NAME.get(name);
}
