import { toSlug } from "./toSlug";

export interface AreaRoute {
  path: string;
  title: string;
  teamKey: string;
  maxChampions: number;
}

export function buildAreaRoutes<T extends Record<string, string>>(
  source: T,
  options: {
    titleSuffix: string;
    maxChampions: number;
  }
): AreaRoute[] {
  return Object.keys(source).map((key) => ({
    path: toSlug(key),
    title: `${source[key as keyof T]} ${options.titleSuffix}`,
    teamKey: key,
    maxChampions: options.maxChampions,
  }));
}
