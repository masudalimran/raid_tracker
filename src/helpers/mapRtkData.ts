import { ChampionAffinity } from "../models/ChampionAffinity";
import { ChampionFaction } from "../models/ChampionFaction";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionType } from "../models/ChampionType";
import type IChampion from "../models/IChampion";
import type { IGear } from "../models/IGear";
import { RSL_CHAMPION_DB } from "../data/rsl_champion_db";
import { getSetInfo, slotToGearSlot } from "./gearSetMap";
import type { RTKHero, RTKArtifact, RTKHeroType } from "../services/rtkService";

// ── Enum mappers ─────────────────────────────────────────────────────────────

const AFFINITY_MAP: Record<string, string> = {
  magic:  ChampionAffinity.MAGIC,
  force:  ChampionAffinity.FORCE,
  spirit: ChampionAffinity.SPIRIT,
  void:   ChampionAffinity.VOID,
};

const FACTION_MAP: Record<string, string> = {
  BannerLords:    ChampionFaction.BANNER_LORDS,
  HighElves:      ChampionFaction.HIGH_ELVES,
  SacredOrder:    ChampionFaction.SACRED_ORDER,
  CovenOfMagi:    ChampionFaction.DARK_ELVES,
  DarkElves:      ChampionFaction.DARK_ELVES,
  OgrynTribes:    ChampionFaction.OGRYN_TRIBES,
  LizardMen:      ChampionFaction.LIZARDMEN,
  Skinwalkers:    ChampionFaction.SKIN_WALKERS,
  Orcs:           ChampionFaction.ORCS,
  Demonspawn:     ChampionFaction.DEMON_SPAWNS,
  UndeadHordes:   ChampionFaction.UNDEAD_HORDES,
  KnightsRevenant:ChampionFaction.KNIGHTS_REVENANT,
  Barbarians:     ChampionFaction.BARBARIANS,
  NyresanElves:   ChampionFaction.SYLVAN_WATCHERS,
  Samurai:        ChampionFaction.SHADOWKINS,
  Dwarves:        ChampionFaction.DWARVES,
};

const RARITY_MAP: Record<string, string> = {
  Common:    ChampionRarity.COMMON,
  Uncommon:  ChampionRarity.UNCOMMON,
  Rare:      ChampionRarity.RARE,
  Epic:      ChampionRarity.EPIC,
  Legendary: ChampionRarity.LEGENDARY,
  Mythic:    ChampionRarity.MYTHICAL,
};

const HERO_ROLE_TO_TYPE: Record<string, string> = {
  Attack:  ChampionType.ATTACK,
  Defense: ChampionType.DEFENSE,
  Health:  ChampionType.HP,
  Support: ChampionType.SUPPORT,
  Evolve:  ChampionType.SUPPORT,
  Xp:      ChampionType.SUPPORT,
};

// ── Artifact mapper ───────────────────────────────────────────────────────────

export function mapArtifact(raw: RTKArtifact): IGear {
  const setInfo = getSetInfo(raw.setKindId);
  return {
    artifactId:  raw.id,
    slot:        slotToGearSlot(raw.kindId) as IGear["slot"],
    setKindId:   raw.setKindId,
    setName:     setInfo.name,
    rank:        raw.rank ?? 0,
    level:       raw.level ?? 0,
    rarity:      raw.rarity ?? "Unknown",
    primaryStat: {
      name:       raw.primaryBonus?.kind ?? "",
      value:      raw.primaryBonus?.value ?? 0,
      isAbsolute: raw.primaryBonus?.absolute ?? true,
    },
    subStats: (raw.secondaryBonuses ?? []).map((b) => ({
      name:       b.kind,
      value:      b.value,
      isAbsolute: b.absolute,
    })),
  };
}

// ── Hero mapper ───────────────────────────────────────────────────────────────

export interface MappedHeroResult {
  champion: Partial<IChampion>;
  gear: IGear[];
}

export function mapRtkHero(
  hero: RTKHero,
  heroTypes: Record<number, RTKHeroType>,
  artifactMap: Map<number, RTKArtifact>,
  accountId: string,
  userId: string,
): MappedHeroResult {
  const heroType = heroTypes[hero.typeId];

  // Prefer static hero type data; fall back to our local DB keyed by name
  const dbKey = hero.name?.toLowerCase();
  const dbEntry = dbKey ? RSL_CHAMPION_DB[dbKey] : undefined;

  const affinity =
    AFFINITY_MAP[heroType?.affinity ?? ""] ??
    dbEntry?.affinity ??
    ChampionAffinity.MAGIC;

  const faction =
    FACTION_MAP[heroType?.faction ?? ""] ??
    dbEntry?.faction ??
    ChampionFaction.BANNER_LORDS;

  const rarity =
    RARITY_MAP[heroType?.rarity ?? ""] ??
    dbEntry?.rarity ??
    ChampionRarity.COMMON;

  const heroRole = heroType?.forms?.[0]?.role ?? "Support";
  const type =
    HERO_ROLE_TO_TYPE[heroRole] ??
    (dbEntry?.type as string) ??
    ChampionType.SUPPORT;

  // Compute stats — RTK returns absolute displayed values
  const s = hero.stats ?? {};
  const hp       = Math.round(s.Health ?? 0);
  const atk      = Math.round(s.Attack ?? 0);
  const def      = Math.round(s.Defense ?? 0);
  const spd      = Math.round(s.Speed ?? 0);
  const res      = Math.round(s.Resistance ?? 0);
  const acc      = Math.round(s.Accuracy ?? 0);
  const c_rate   = Math.round(s.CriticalChance ?? 0);
  const c_dmg    = Math.round(s.CriticalDamage ?? 0);

  // Gather equipped gear
  const gear: IGear[] = [];
  for (const artifactId of Object.values(hero.equippedArtifactIds ?? {})) {
    const raw = artifactMap.get(Number(artifactId));
    if (raw) gear.push(mapArtifact(raw));
  }

  const champion: Partial<IChampion> = {
    name:        hero.name,
    level:       hero.level ?? 1,
    stars:       hero.rank ?? 1,
    ascension_stars: 0,
    awaken_stars:    0,
    affinity:    affinity as IChampion["affinity"],
    type:        type as IChampion["type"],
    rarity:      rarity as IChampion["rarity"],
    faction:     faction as IChampion["faction"],
    role:        [],
    hp, atk, def, spd, res, acc, c_rate, c_dmg,
    has_mastery:     (hero.masteries?.length ?? 0) > 0,
    is_mastery_needed: false,
    is_booked:       false,
    is_book_needed:  false,
    imgUrl:      dbEntry?.imgUrl ?? "",
    championUrl: dbEntry?.championUrl ?? "",
    rsl_account_id: accountId,
    user_id:     userId,
    gear,
  };

  return { champion, gear };
}

// ── Full payload mapper ───────────────────────────────────────────────────────

export interface MappedSyncResult {
  champions: Partial<IChampion>[];
  gearByChampionName: Record<string, IGear[]>;
}

export function mapRtkPayload(
  heroes: RTKHero[],
  artifacts: RTKArtifact[],
  heroTypes: Record<number, RTKHeroType>,
  accountId: string,
  userId: string,
): MappedSyncResult {
  const artifactMap = new Map<number, RTKArtifact>(
    artifacts.map((a) => [a.id, a]),
  );

  const champions: Partial<IChampion>[] = [];
  const gearByChampionName: Record<string, IGear[]> = {};

  for (const hero of heroes) {
    if (!hero.name) continue;
    const { champion, gear } = mapRtkHero(hero, heroTypes, artifactMap, accountId, userId);
    champions.push(champion);
    if (gear.length > 0) gearByChampionName[hero.name] = gear;
  }

  return { champions, gearByChampionName };
}
