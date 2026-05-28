/**
 * Normalizes any RSL export JSON (RaidExtractor / RSL Helper / RTK dump)
 * into the same RTKHero / RTKArtifact / RTKHeroType shape that mapRtkData.ts
 * already knows how to handle.
 *
 * Handles known field-name variations between export tools.
 */

import type { RTKHero, RTKArtifact, RTKHeroType } from "../services/rtkService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

// ── Stat normalizer ───────────────────────────────────────────────────────────

function normalizeStats(hero: AnyObj): RTKHero["stats"] | null {
  // RTK live format — capitalized keys
  if (typeof hero.stats?.Health === "number") return hero.stats;

  // RTK live format stored in computedStats (some dump variants)
  if (typeof hero.stats?.health === "number") {
    return {
      Health:          hero.stats.health,
      Attack:          hero.stats.attack          ?? 0,
      Defense:         hero.stats.defense         ?? 0,
      Speed:           hero.stats.speed           ?? 0,
      Resistance:      hero.stats.resistance      ?? 0,
      Accuracy:        hero.stats.accuracy        ?? 0,
      CriticalChance:  hero.stats.criticalChance  ?? hero.stats.crit_chance  ?? 0,
      CriticalDamage:  hero.stats.criticalDamage  ?? hero.stats.crit_damage  ?? 0,
      CriticalHeal:    hero.stats.criticalHeal    ?? 0,
    };
  }

  // RaidExtractor / RSL Helper — stats directly on hero
  if (typeof hero.health === "number") {
    return {
      Health:          hero.health,
      Attack:          hero.attack          ?? 0,
      Defense:         hero.defense         ?? 0,
      Speed:           hero.speed           ?? 0,
      Resistance:      hero.resistance      ?? 0,
      Accuracy:        hero.accuracy        ?? 0,
      CriticalChance:  hero.criticalChance  ?? hero.crit_chance  ?? 0,
      CriticalDamage:  hero.criticalDamage  ?? hero.crit_damage  ?? 0,
      CriticalHeal:    hero.criticalHeal    ?? 0,
    };
  }

  // computedStats wrapper used by some exports
  const cs = hero.computedStats ?? hero.computed_stats;
  if (cs && typeof cs.health === "number") {
    return {
      Health:          cs.health,
      Attack:          cs.attack          ?? 0,
      Defense:         cs.defense         ?? 0,
      Speed:           cs.speed           ?? 0,
      Resistance:      cs.resistance      ?? 0,
      Accuracy:        cs.accuracy        ?? 0,
      CriticalChance:  cs.criticalChance  ?? cs.crit_chance  ?? 0,
      CriticalDamage:  cs.criticalDamage  ?? cs.crit_damage  ?? 0,
      CriticalHeal:    cs.criticalHeal    ?? 0,
    };
  }

  return null;
}

// ── Stat bonus normalizer ─────────────────────────────────────────────────────

function normalizeBonuses(raw: AnyObj[] = []): RTKArtifact["secondaryBonuses"] {
  return raw.map((b) => ({
    kind:     b.kind ?? b.statType ?? "",
    absolute: b.absolute ?? b.isAbsolute ?? true,
    value:    b.value ?? 0,
  }));
}

// ── Artifact normalizer ───────────────────────────────────────────────────────

function normalizeArtifact(raw: AnyObj): RTKArtifact {
  const pb = raw.primaryBonus ?? raw.primary_bonus ?? raw.primaryStat ?? {};
  return {
    id:         raw.id,
    kindId:     raw.kindId   ?? raw.kind     ?? raw.slot   ?? "",
    setKindId:  raw.setKindId ?? raw.set      ?? raw.setKind ?? "None",
    rank:       raw.rank     ?? raw.stars    ?? 0,
    rarity:     raw.rarity   ?? "Unknown",
    level:      raw.level    ?? 0,
    primaryBonus: {
      kind:     pb.kind     ?? pb.statType  ?? "",
      absolute: pb.absolute ?? pb.isAbsolute ?? false,
      value:    pb.value    ?? 0,
    },
    secondaryBonuses: normalizeBonuses(
      raw.secondaryBonuses ?? raw.secondary_bonuses ?? raw.subStats ?? [],
    ),
  };
}

// ── Hero type normalizer ──────────────────────────────────────────────────────

function normalizeHeroType(raw: AnyObj, typeId: number): RTKHeroType {
  const nameObj = raw.name ?? {};
  return {
    typeId,
    name: {
      defaultValue:   nameObj.defaultValue   ?? nameObj.en ?? String(raw.name ?? ""),
      localizedValue: nameObj.localizedValue ?? nameObj.defaultValue ?? "",
    },
    affinity: raw.affinity ?? raw.element ?? "",
    faction:  raw.faction  ?? raw.fraction ?? "",
    rarity:   raw.rarity   ?? "",
    forms:    (raw.forms ?? []).map((f: AnyObj) => ({ role: f.role ?? "" })),
  };
}

// ── Hero normalizer ───────────────────────────────────────────────────────────

function normalizeHero(
  raw: AnyObj,
  artifactById: Map<number, AnyObj>,
  heroEquipMap: Map<number, number[]>,
): RTKHero {
  const stats = normalizeStats(raw) ?? {
    Health: 0, Attack: 0, Defense: 0, Speed: 0,
    Resistance: 0, Accuracy: 0, CriticalChance: 0, CriticalDamage: 0, CriticalHeal: 0,
  };

  // Resolve equipped artifact IDs from multiple possible sources
  let equippedIds: number[] = [];

  if (raw.equippedArtifactIds && typeof raw.equippedArtifactIds === "object" && !Array.isArray(raw.equippedArtifactIds)) {
    // RTK live format: Record<slot, artifactId>
    equippedIds = Object.values(raw.equippedArtifactIds) as number[];
  } else if (Array.isArray(raw.artifacts)) {
    equippedIds = raw.artifacts.filter((x: unknown) => typeof x === "number");
  } else if (Array.isArray(raw.equippedArtifactIds)) {
    equippedIds = raw.equippedArtifactIds;
  } else if (heroEquipMap.has(raw.id)) {
    equippedIds = heroEquipMap.get(raw.id)!;
  }

  // Build slot→artifactId record from the equipped IDs + each artifact's kindId
  const equippedArtifactIds: Record<string, number> = {};
  for (const artId of equippedIds) {
    const art = artifactById.get(Number(artId));
    if (art) {
      const slot = art.kindId ?? art.kind ?? art.slot ?? String(artId);
      equippedArtifactIds[slot] = Number(artId);
    }
  }

  return {
    id:        raw.id,
    typeId:    raw.typeId ?? raw.type_id ?? 0,
    name:      raw.name   ?? "",
    level:     raw.level  ?? 1,
    rank:      raw.rank   ?? raw.grade ?? raw.stars ?? 1,
    masteries: Array.isArray(raw.masteries) ? raw.masteries : [],
    equippedArtifactIds,
    stats,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ParseResult {
  heroes:       RTKHero[];
  artifacts:    RTKArtifact[];
  heroTypes:    Record<number, RTKHeroType>;
  hasStats:     boolean;
  warnings:     string[];
}

export function parseImportJson(raw: unknown): ParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid JSON: expected an object at the top level.");
  }

  const obj = raw as AnyObj;
  const warnings: string[] = [];

  // ── Artifacts ────────────────────────────────────────────────────────────
  const rawArtifacts: AnyObj[] = Array.isArray(obj.artifacts) ? obj.artifacts : [];
  if (rawArtifacts.length === 0) warnings.push("No artifacts found in the file.");
  const artifacts = rawArtifacts.map(normalizeArtifact);

  // Build a fast lookup by artifact id (use original raw for slot resolution)
  const artifactById = new Map<number, AnyObj>(rawArtifacts.map((a) => [a.id, a]));

  // ── Top-level equipment map (some exports use heroesEquippedArtifacts) ────
  const heroEquipMap = new Map<number, number[]>();
  if (obj.heroesEquippedArtifacts && typeof obj.heroesEquippedArtifacts === "object") {
    for (const [heroId, artIds] of Object.entries(obj.heroesEquippedArtifacts)) {
      if (Array.isArray(artIds)) heroEquipMap.set(Number(heroId), artIds as number[]);
    }
  }

  // ── Heroes ────────────────────────────────────────────────────────────────
  const rawHeroes: AnyObj[] = Array.isArray(obj.heroes) ? obj.heroes : [];
  if (rawHeroes.length === 0) throw new Error("No heroes found in the file. Is this a valid RSL export?");
  const heroes = rawHeroes
    .filter((h) => !h.deleted && !h.inStorage)
    .map((h) => normalizeHero(h, artifactById, heroEquipMap));

  // Detect whether stats were actually present
  const hasStats = rawHeroes.some((h) => normalizeStats(h) !== null);
  if (!hasStats) {
    warnings.push(
      "No computed stats found in this export. Champion stats (HP, ATK, etc.) will be set to 0 — you can update them manually or use RTK Sync for live stats.",
    );
  }

  // ── HeroTypes ─────────────────────────────────────────────────────────────
  const heroTypes: Record<number, RTKHeroType> = {};
  const rawHeroTypes = obj.heroTypes ?? obj.hero_types ?? {};

  if (Array.isArray(rawHeroTypes)) {
    for (const ht of rawHeroTypes) {
      const id = ht.typeId ?? ht.id;
      if (id !== undefined) heroTypes[Number(id)] = normalizeHeroType(ht, Number(id));
    }
  } else if (typeof rawHeroTypes === "object") {
    for (const [key, ht] of Object.entries(rawHeroTypes as Record<string, AnyObj>)) {
      const id = Number(key);
      heroTypes[id] = normalizeHeroType(ht, id);
    }
  }

  if (Object.keys(heroTypes).length === 0) {
    warnings.push(
      "No heroTypes data found. Champion affinity, faction and rarity will be looked up from our local database by name.",
    );
  }

  // Backfill names from heroTypes into heroes where name is missing
  for (const hero of heroes) {
    if (!hero.name && heroTypes[hero.typeId]) {
      const ht = heroTypes[hero.typeId];
      hero.name = ht.name.localizedValue || ht.name.defaultValue;
    }
    // Also backfill hero type fields (affinity/faction/rarity/role) directly
    // if they're on the raw hero object and not in heroTypes
    const rawH = rawHeroes.find((h) => h.id === hero.id);
    if (rawH && !heroTypes[hero.typeId]) {
      heroTypes[hero.typeId] = {
        typeId: hero.typeId,
        name: { defaultValue: rawH.name ?? "", localizedValue: rawH.name ?? "" },
        affinity: rawH.element ?? rawH.affinity ?? rawH.fraction ?? "",
        faction:  rawH.fraction ?? rawH.faction ?? "",
        rarity:   rawH.rarity  ?? "",
        forms:    [{ role: rawH.role ?? "" }],
      };
    }
  }

  return { heroes, artifacts, heroTypes, hasStats, warnings };
}
