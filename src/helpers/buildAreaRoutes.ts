import type { TeamIdentifier } from "../data/team_priority_weight";
import { toSlug } from "./toSlug";

export interface HardModePair {
  mode: "normal" | "hard";
  normalPath: string;
  normalTitle: string;
  hardPath: string;
  hardTitle: string;
}

export interface AreaRoute {
  path: string;
  title: string;
  teamKey: TeamIdentifier;
  maxChampions: number;
  isFaction?: boolean;
  isHydra?: boolean;
  hardModePair?: HardModePair;
}

export function buildAreaRoutes<T extends Record<string, string>>(
  source: T,
  options: {
    maxChampions: number;
    isFaction?: boolean;
    isHydra?: boolean;
  },
): AreaRoute[] {
  return Object.keys(source).map((key) => ({
    path: toSlug(key),
    title: `${source[key as keyof T]}`,
    teamKey: key as TeamIdentifier,
    maxChampions: options.maxChampions,
    isFaction: options.isFaction,
    isHydra: options.isHydra,
  }));
}

const HARD_SUFFIX = "_hard";

/**
 * Pairs up "X" / "X Hard" routes within the same group (detected purely from
 * the `_hard`-suffixed slug, e.g. "dragon" / "dragon_hard") so both keep
 * their own URL while their page can render a Normal/Hard selector instead
 * of the two showing up as separate sidebar entries.
 */
export function attachHardModePairs(routes: AreaRoute[]): AreaRoute[] {
  const byPath = new Map(routes.map((r) => [r.path, r]));

  return routes.map((route) => {
    if (route.path.endsWith(HARD_SUFFIX)) {
      const normalPath = route.path.slice(0, -HARD_SUFFIX.length);
      const normal = byPath.get(normalPath);
      if (!normal) return route;
      return {
        ...route,
        hardModePair: {
          mode: "hard",
          normalPath: normal.path,
          normalTitle: normal.title,
          hardPath: route.path,
          hardTitle: route.title,
        },
      };
    }

    const hard = byPath.get(`${route.path}${HARD_SUFFIX}`);
    if (!hard) return route;
    return {
      ...route,
      hardModePair: {
        mode: "normal",
        normalPath: route.path,
        normalTitle: route.title,
        hardPath: hard.path,
        hardTitle: hard.title,
      },
    };
  });
}
