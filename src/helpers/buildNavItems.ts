import type { NavItem } from "../components/modals/NavItem";
import toSlug from "./toSlug";
import type ITeam from "../models/ITeam";
import type IChampion from "../models/IChampion";
import { getAreaBuildStatus, getAreaCoverageBadge } from "../data/areaRoleRequirements";

export default function buildNavItems<T extends Record<string, string>>(
  source: T,
  teams: ITeam[] = [],
  champions: IChampion[] = [],
  maxChampions = 5,
): NavItem[] {
  return Object.keys(source).map((key, index) => ({
    name: source[key as keyof T],
    path: `/${toSlug(key)}`,
    className: index === 0 ? "" : "",
    badge: getAreaCoverageBadge(key, teams, champions) ?? undefined,
    buildStatus: getAreaBuildStatus(key, teams, champions, maxChampions) ?? undefined,
  }));
}
