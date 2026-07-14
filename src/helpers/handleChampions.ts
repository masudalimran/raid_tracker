import { supabase } from "../lib/supabaseClient";
import { ChampionRarity } from "../models/ChampionRarity";
import { ChampionType } from "../models/ChampionType";
import { ChampionFaction } from "../models/ChampionFaction";
import type { Aura } from "../models/IChampion";
import type IChampion from "../models/IChampion";
import type { IGear } from "../models/IGear";
import DefaultChampionObject from "../components/forms/defaultChampionObject";
import { checkIfChampionIsBuilt } from "./checkIfChampionIsBuilt";
import { sortChampionsByPowerDesc } from "./getChampionPowerScore";
import { sortByLevelDesc } from "./sortChampions";

function loadGearStore(): Record<string, IGear[]> {
  try {
    return JSON.parse(localStorage.getItem("rtk_gear_data") ?? "{}") as Record<string, IGear[]>;
  } catch {
    return {};
  }
}

const parseChampionData = (champion: IChampion, gearStore: Record<string, IGear[]>): IChampion => {
  // Parse skills
  if (champion.parsed_skills && typeof champion.parsed_skills === "string") {
    try {
      champion.skills = JSON.parse(champion.parsed_skills);
    } catch (e) {
      console.error(`Failed to parse skills for champion ${champion.name}`, e);
      champion.skills = [];
    }
  } else {
    champion.skills = champion.skills ?? [];
  }

  // Parse aura
  if (champion.parsed_aura && typeof champion.parsed_aura === "string") {
    try {
      champion.aura = JSON.parse(champion.parsed_aura) as Aura;
    } catch (e) {
      console.error(`Failed to parse aura for champion ${champion.name}`, e);
      champion.aura = { effect: "", active_in: "All", effectiveness: "" };
    }
  } else {
    champion.aura = champion.aura ?? {
      effect: "",
      active_in: "All",
      effectiveness: "",
    };
  }

  // Attach gear from RTK localStorage store
  if (!champion.gear) {
    champion.gear = gearStore[champion.name?.toLowerCase() ?? ""] ?? [];
  }

  // Treat unset/legacy "N/A" type and faction as "Other" so champions remain
  // searchable and filterable.
  if (!champion.type || (champion.type as string) === "N/A") {
    champion.type = ChampionType.OTHER;
  }
  if (!champion.faction || (champion.faction as string) === "N/A") {
    champion.faction = ChampionFaction.OTHER;
  }

  return champion;
};

export const fetchChampions = async (): Promise<IChampion[]> => {
  let championList: IChampion[] = [];
  const supabase_champion_list = localStorage.getItem("supabase_champion_list");

  if (supabase_champion_list) {
    championList = JSON.parse(supabase_champion_list) as IChampion[];
  } else {
    const { data, error } = await supabase.from("champions").select("*");

    if (error) {
      console.error(error);
    } else {
      championList = data as IChampion[];
      localStorage.setItem("supabase_champion_list", JSON.stringify(data));
    }
  }

  const gearStore = loadGearStore();
  return championList.map((c) => parseChampionData(c, gearStore));
};

export const generateChampions = async (): Promise<IChampion[]> => {
  let supabase_champion_list: IChampion[] = JSON.parse(
    localStorage.getItem("supabase_champion_list") ?? "[]",
  );

  const current_rsl_account = JSON.parse(
    localStorage.getItem("supabase_rsl_account_list") ?? "[]",
  ).find((acc: { is_currently_active: boolean }) => acc.is_currently_active);

  if (!current_rsl_account) return [];

  const gearStore = loadGearStore();
  supabase_champion_list = [...supabase_champion_list]
    .filter((champion) => champion.rsl_account_id === current_rsl_account.id)
    .map((c) => parseChampionData(c, gearStore));

  const mythical_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.MYTHICAL,
  );
  const legendary_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.LEGENDARY,
  );
  const epic_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.EPIC,
  );
  const rare_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.RARE,
  );
  const uncommon_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.UNCOMMON,
  );
  const common_champions = supabase_champion_list.filter(
    (champion) => champion.rarity === ChampionRarity.COMMON,
  );
  // Champions with an unset/unrecognized rarity (e.g. "N/A" from Shard Log
  // auto-creation) — keep them visible instead of dropping them.
  const known_rarities: string[] = Object.values(ChampionRarity);
  const other_champions = supabase_champion_list.filter(
    (champion) => !known_rarities.includes(champion.rarity),
  );

  const champions_sorted_by_rarity = [
    ...mythical_champions,
    ...legendary_champions,
    ...epic_champions,
    ...rare_champions,
    ...uncommon_champions,
    ...common_champions,
    ...other_champions,
  ];

  const champions_that_are_built = sortByLevelDesc(
    champions_sorted_by_rarity.filter((champion) =>
      checkIfChampionIsBuilt(champion),
    ),
  );

  const champions_that_are_not_built = sortByLevelDesc(
    champions_sorted_by_rarity.filter(
      (champion) => !checkIfChampionIsBuilt(champion),
    ),
  );

  const sorted_champions = [
    ...champions_that_are_built,
    ...champions_that_are_not_built,
  ];

  return await sortChampionsByPowerDesc(sorted_champions);
};

// Champions auto-created from the Shard Log (type/faction "Other") that are
// duplicates — i.e. share a name + RSL account with an earlier entry. Keeps
// the first occurrence per (rsl_account_id, name) and flags the rest.
export const findOtherChampionDuplicates = (championList: IChampion[]): IChampion[] => {
  const seen = new Set<string>();
  const duplicates: IChampion[] = [];

  for (const champion of championList) {
    if (champion.type !== ChampionType.OTHER && champion.faction !== ChampionFaction.OTHER) continue;

    const key = `${champion.rsl_account_id ?? ""}::${champion.name.toLowerCase()}`;
    if (seen.has(key)) {
      duplicates.push(champion);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
};

// ── Cross-account data reconciliation ──────────────────────────────────────
// Champions with the same name can end up duplicated across RSL accounts (or,
// via Shard Log auto-add, within one account) with inconsistent data — one
// copy has a real image/identity set, the others are still on the default
// placeholder. This fills in the gaps on those placeholder copies using
// whichever same-named champion has the most complete data, without ever
// touching the "reference" copy itself.

export interface ChampionReconciliationPlanEntry {
  id: string | number;
  name: string;
  patch: Partial<IChampion>;
}

const isDefaultImage = (imgUrl?: string) =>
  !imgUrl || imgUrl === DefaultChampionObject.imgUrl;

export const computeChampionReconciliationPlan = (
  allChampions: IChampion[],
): ChampionReconciliationPlanEntry[] => {
  const groups = new Map<string, IChampion[]>();
  for (const champion of allChampions) {
    if (!champion.name || champion.id == null) continue;
    const key = champion.name.trim().toLowerCase();
    const group = groups.get(key) ?? [];
    group.push(champion);
    groups.set(key, group);
  }

  const plan: ChampionReconciliationPlanEntry[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    // Identity reference: the copy with a real (non-default) image is
    // trusted to also have the correct affinity/type/role.
    const imageReference = group.find((c) => !isDefaultImage(c.imgUrl));
    const urlReference = group.find(
      (c) => c.championUrl && c.championUrl.trim() !== "",
    );
    const factionReference = group.find(
      (c) => c.faction && c.faction !== ChampionFaction.OTHER,
    );

    for (const champion of group) {
      const patch: Partial<IChampion> = {};

      if (
        imageReference &&
        champion.id !== imageReference.id &&
        isDefaultImage(champion.imgUrl)
      ) {
        patch.imgUrl = imageReference.imgUrl;
        patch.affinity = imageReference.affinity;
        patch.type = imageReference.type;
        patch.role = imageReference.role;
      }

      if (
        urlReference &&
        champion.id !== urlReference.id &&
        (!champion.championUrl || champion.championUrl.trim() === "")
      ) {
        patch.championUrl = urlReference.championUrl;
      }

      if (
        factionReference &&
        champion.id !== factionReference.id &&
        (!champion.faction || champion.faction === ChampionFaction.OTHER)
      ) {
        patch.faction = factionReference.faction;
      }

      if (Object.keys(patch).length > 0) {
        plan.push({ id: champion.id!, name: champion.name, patch });
      }
    }
  }

  return plan;
};

// Writes a reconciliation plan to Supabase and mirrors the changes into the
// local champion cache so the UI reflects them without a full refetch.
export const applyChampionReconciliationPlan = async (
  plan: ChampionReconciliationPlanEntry[],
): Promise<{ success: boolean; error?: string }> => {
  if (plan.length === 0) return { success: true };

  const results = await Promise.all(
    plan.map(({ id, patch }) => supabase.from("champions").update(patch).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { success: false, error: failed.error.message };
  }

  const patchById = new Map(plan.map((entry) => [String(entry.id), entry.patch]));
  const stored = JSON.parse(
    localStorage.getItem("supabase_champion_list") ?? "[]",
  ) as IChampion[];
  const updated = stored.map((c) => {
    const patch = patchById.get(String(c.id));
    return patch ? { ...c, ...patch } : c;
  });
  localStorage.setItem("supabase_champion_list", JSON.stringify(updated));

  return { success: true };
};

// Deletes the given champions from Supabase and the local cache.
export const removeChampions = async (
  champions: IChampion[],
): Promise<{ success: boolean; error?: string }> => {
  const ids = champions.map((c) => c.id).filter((id): id is string | number => id != null);
  if (ids.length === 0) return { success: true };

  const { error } = await supabase.from("champions").delete().in("id", ids);
  if (error) {
    console.error("[champions] failed to remove duplicates:", error.message);
    return { success: false, error: error.message };
  }

  const idSet = new Set(ids.map(String));
  const stored = JSON.parse(localStorage.getItem("supabase_champion_list") ?? "[]") as IChampion[];
  const filtered = stored.filter((c) => !idSet.has(String(c.id)));
  localStorage.setItem("supabase_champion_list", JSON.stringify(filtered));

  return { success: true };
};
