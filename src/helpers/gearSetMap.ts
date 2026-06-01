export interface GearSetInfo {
  name: string;
  color: string; // Tailwind bg class
  textColor: string; // Tailwind text class
}

// Maps RTK ArtifactSetKindId string values → display name + color
export const GEAR_SET_MAP: Record<string, GearSetInfo> = {
  AttackSpeed:                            { name: "Speed",        color: "bg-blue-400",    textColor: "text-blue-800" },
  CriticalChance:                         { name: "Crit Rate",    color: "bg-yellow-400",  textColor: "text-yellow-900" },
  CriticalDamage:                         { name: "Crit DMG",     color: "bg-orange-400",  textColor: "text-orange-900" },
  LifeDrain:                              { name: "Lifesteal",    color: "bg-red-500",     textColor: "text-white" },
  AttackPower:                            { name: "Offense",      color: "bg-red-400",     textColor: "text-red-900" },
  Defense:                                { name: "Defense",      color: "bg-gray-400",    textColor: "text-gray-900" },
  Hp:                                     { name: "Life",         color: "bg-green-400",   textColor: "text-green-900" },
  Accuracy:                               { name: "Accuracy",     color: "bg-purple-400",  textColor: "text-purple-900" },
  Resistance:                             { name: "Resist",       color: "bg-indigo-400",  textColor: "text-indigo-900" },
  DamageIncreaseOnHpDecrease:             { name: "Savage",       color: "bg-red-600",     textColor: "text-white" },
  SleepChance:                            { name: "Sleep",        color: "bg-blue-300",    textColor: "text-blue-900" },
  BlockHealChance:                        { name: "Cursed",       color: "bg-purple-600",  textColor: "text-white" },
  FreezeRateOnDamageReceived:             { name: "Frost",        color: "bg-cyan-400",    textColor: "text-cyan-900" },
  Stamina:                                { name: "Frenzy",       color: "bg-orange-500",  textColor: "text-white" },
  Heal:                                   { name: "Regeneration", color: "bg-emerald-400", textColor: "text-emerald-900" },
  BlockDebuff:                            { name: "Immunity",     color: "bg-teal-400",    textColor: "text-teal-900" },
  Shield:                                 { name: "Shield",       color: "bg-slate-400",   textColor: "text-slate-900" },
  GetExtraTurn:                           { name: "Reflex",       color: "bg-amber-400",   textColor: "text-amber-900" },
  IgnoreDefense:                          { name: "Cruel",        color: "bg-rose-600",    textColor: "text-white" },
  DecreaseMaxHp:                          { name: "Destroy",      color: "bg-gray-600",    textColor: "text-white" },
  StunChance:                             { name: "Stun",         color: "bg-yellow-500",  textColor: "text-yellow-900" },
  DotRate:                                { name: "Toxic",        color: "bg-lime-500",    textColor: "text-lime-900" },
  ProvokeChance:                          { name: "Taunting",     color: "bg-orange-600",  textColor: "text-white" },
  Counterattack:                          { name: "Retaliation",  color: "bg-amber-600",   textColor: "text-white" },
  CounterattackOnCrit:                    { name: "Avenging",     color: "bg-amber-500",   textColor: "text-amber-900" },
  AoeDamageDecrease:                      { name: "Stalwart",     color: "bg-blue-600",    textColor: "text-white" },
  CooldownReductionChance:                { name: "Daze",         color: "bg-violet-400",  textColor: "text-violet-900" },
  CriticalHealMultiplier:                 { name: "Curing",       color: "bg-green-500",   textColor: "text-white" },
  HpAndHeal:                              { name: "Immortal",     color: "bg-green-600",   textColor: "text-white" },
  UnkillableAndSpdAndCrDmg:              { name: "Stoneskin",    color: "bg-stone-500",   textColor: "text-white" },
  StoneSkinHpResDef:                      { name: "Stoneskin",    color: "bg-stone-500",   textColor: "text-white" },
  AccuracyAndSpeed:                       { name: "Perception",   color: "bg-purple-500",  textColor: "text-white" },
  CritDmgAndTransformWeekIntoCritHit:     { name: "Lethal",       color: "bg-red-700",     textColor: "text-white" },
  ResistanceAndBlockDebuff:               { name: "Untouchable",  color: "bg-indigo-600",  textColor: "text-white" },
  AttackAndCritRate:                      { name: "Fervor",       color: "bg-pink-500",    textColor: "text-white" },
  CritDamageAndSpeed:                     { name: "Swift Parry",  color: "bg-cyan-500",    textColor: "text-cyan-900" },
  SpeedAndIgnoreDefMultiplier:            { name: "Bloodthirst",  color: "bg-red-800",     textColor: "text-white" },
  AttackPowerAndIgnoreDefense:            { name: "Demonic",      color: "bg-rose-700",    textColor: "text-white" },
  ShieldAndAttackPower:                   { name: "Warmonger",    color: "bg-orange-700",  textColor: "text-white" },
  ShieldAndCriticalChance:                { name: "Bolster",      color: "bg-slate-500",   textColor: "text-white" },
  ShieldAndHp:                            { name: "Guardian",     color: "bg-slate-600",   textColor: "text-white" },
  ShieldAndSpeed:                         { name: "Resilience",   color: "bg-blue-700",    textColor: "text-white" },
  BlockReflectDebuffAndHpAndDef:          { name: "Bulwark",      color: "bg-gray-700",    textColor: "text-white" },
  HpAndDefence:                           { name: "Deflection",   color: "bg-gray-500",    textColor: "text-white" },
  FreezeResistAndRate:                    { name: "Glacial",      color: "bg-sky-400",     textColor: "text-sky-900" },
  CritRateAndLifeDrain:                   { name: "Crimson",      color: "bg-rose-500",    textColor: "text-white" },
  PassiveShareDamageAndHeal:              { name: "Solidarity",   color: "bg-teal-500",    textColor: "text-white" },
  ResistAndDef:                           { name: "Fortitude",    color: "bg-indigo-500",  textColor: "text-white" },
  CritRateAndIgnoreDefMultiplier:         { name: "Destruction",  color: "bg-red-900",     textColor: "text-white" },
  BuffChanceResHpSpd:                     { name: "Reviver",      color: "bg-emerald-500", textColor: "text-white" },
  CritDmgAndDmgIncreaseOnHpIncrease:      { name: "Wrath",        color: "bg-amber-700",   textColor: "text-white" },
  IncreaseStaminaAndSpdAndAcc:            { name: "Overdrive",    color: "bg-violet-500",  textColor: "text-white" },
  CritDmgAndIgnoreDefAndCdReductionChance:{ name: "Lethal Edge",  color: "bg-red-700",     textColor: "text-white" },
  SpeedAndResistance:                     { name: "Evasion",      color: "bg-blue-500",    textColor: "text-white" },
  IgnoreCooldown:                         { name: "Relentless",   color: "bg-violet-600",  textColor: "text-white" },
  RemoveDebuff:                           { name: "Cleansing",    color: "bg-sky-300",     textColor: "text-sky-900" },
  ShieldAccessory:                        { name: "Bastion",      color: "bg-slate-700",   textColor: "text-white" },
  ChangeHitType:                          { name: "Phantom",      color: "bg-gray-800",    textColor: "text-white" },
  CounterattackAccessory:                 { name: "Riposte",      color: "bg-amber-800",   textColor: "text-white" },
  ShieldAndHp2:                           { name: "Bastion II",   color: "bg-slate-800",   textColor: "text-white" },
  DefAndAoeDamageReduce:                  { name: "Rampart",      color: "bg-gray-600",    textColor: "text-white" },
  SpeedAndCdReductionChance:              { name: "Swiftness",    color: "bg-blue-400",    textColor: "text-blue-900" },
};

export function getSetInfo(setKindId: string): GearSetInfo {
  return GEAR_SET_MAP[setKindId] ?? { name: setKindId, color: "bg-gray-300", textColor: "text-gray-700" };
}

// Reverse lookup by display name (for gear recommendations)
let _nameIndex: Map<string, GearSetInfo> | null = null;
function getNameIndex(): Map<string, GearSetInfo> {
  if (!_nameIndex) {
    _nameIndex = new Map(
      Object.values(GEAR_SET_MAP).map((info) => [info.name.toLowerCase(), info]),
    );
  }
  return _nameIndex;
}

export function getSetInfoByName(displayName: string): GearSetInfo {
  return (
    getNameIndex().get(displayName.toLowerCase()) ??
    { name: displayName, color: "bg-gray-200", textColor: "text-gray-600" }
  );
}

// Artifact slot kindId → display name
export const SLOT_DISPLAY_MAP: Record<string, string> = {
  Helmet:    "Helmet",
  Chest:     "Chest",
  Gauntlets: "Gloves",
  Boots:     "Boots",
  Weapon:    "Weapon",
  Shield:    "Shield",
  Ring:      "Ring",
  Necklace:  "Amulet",
  Banner:    "Banner",
  // Numeric fallbacks (just in case)
  "1": "Helmet",
  "2": "Chest",
  "3": "Gloves",
  "4": "Boots",
  "5": "Weapon",
  "6": "Shield",
  "7": "Ring",
  "8": "Amulet",
  "9": "Banner",
};

export function slotToGearSlot(kindId: string): string {
  return SLOT_DISPLAY_MAP[kindId] ?? kindId;
}
