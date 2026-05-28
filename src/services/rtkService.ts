import { useRaidToolkitApi, IAccountApi, IStaticDataApi } from "@raid-toolkit/webclient";
import type { AccountInfo } from "@raid-toolkit/webclient";

export type { AccountInfo };

export interface RTKStats {
  Health: number;
  Attack: number;
  Defense: number;
  Speed: number;
  Resistance: number;
  Accuracy: number;
  CriticalChance: number;
  CriticalDamage: number;
  CriticalHeal: number;
}

export interface RTKStatBonus {
  kind: string;
  absolute: boolean;
  value: number;
}

export interface RTKArtifact {
  id: number;
  kindId: string;
  setKindId: string;
  rank: number;
  rarity: string;
  level: number;
  primaryBonus: RTKStatBonus;
  secondaryBonuses: RTKStatBonus[];
}

export interface RTKHero {
  id: number;
  typeId: number;
  name: string;
  level: number;
  rank: number;
  masteries: string[];
  equippedArtifactIds: Record<string, number>;
  stats: RTKStats;
}

export interface RTKHeroType {
  typeId: number;
  name: { defaultValue: string; localizedValue: string };
  affinity: string;
  faction: string;
  rarity: string;
  forms: Array<{ role: string }>;
}

export interface RTKSyncPayload {
  heroes: RTKHero[];
  artifacts: RTKArtifact[];
  heroTypes: Record<number, RTKHeroType>;
}

let _accountApi: InstanceType<typeof IAccountApi> | null = null;
let _staticApi: InstanceType<typeof IStaticDataApi> | null = null;

function getApis() {
  if (!_accountApi) _accountApi = useRaidToolkitApi(IAccountApi, true);
  if (!_staticApi) _staticApi = useRaidToolkitApi(IStaticDataApi, true);
  return { accountApi: _accountApi, staticApi: _staticApi };
}

export function resetRtkConnection() {
  _accountApi = null;
  _staticApi = null;
}

export async function fetchRtkAccounts(): Promise<AccountInfo[]> {
  const { accountApi } = getApis();
  return accountApi.getAccounts();
}

export async function fetchRtkSyncPayload(accountId: string): Promise<RTKSyncPayload> {
  const { accountApi, staticApi } = getApis();
  const [heroesRaw, artifactsRaw, heroDataRaw] = await Promise.all([
    accountApi.getHeroes(accountId, true),
    accountApi.getArtifacts(accountId),
    staticApi.getHeroData(),
  ]);
  return {
    heroes: heroesRaw as RTKHero[],
    artifacts: artifactsRaw as RTKArtifact[],
    heroTypes: (heroDataRaw as { heroTypes: Record<number, RTKHeroType> }).heroTypes,
  };
}
