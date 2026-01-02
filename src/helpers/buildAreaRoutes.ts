import type { TeamIdentifier } from "../data/team_priority_weight";
import { toSlug } from "./toSlug";

export interface AreaRoute {
  path: string;
  title: string;
  teamKey: TeamIdentifier;
  maxChampions: number;
  isFaction?: boolean;
}

export function buildAreaRoutes<T extends Record<string, string>>(
  source: T,
  options: {
    maxChampions: number;
    isFaction?: boolean;
  }
): AreaRoute[] {
  return Object.keys(source).map((key) => ({
    path: toSlug(key),
    title: `${source[key as keyof T]}`,
    teamKey: key as TeamIdentifier,
    maxChampions: options.maxChampions,
    isFaction: options.isFaction,
  }));
}
