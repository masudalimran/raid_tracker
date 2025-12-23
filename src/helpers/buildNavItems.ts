import type { NavItem } from "../components/modals/NavItem";
import toSlug from "./toSlug";

export default function buildNavItems<T extends Record<string, string>>(
  source: T
): NavItem[] {
  return Object.keys(source).map((key, index) => ({
    name: source[key as keyof T],
    path: `/${toSlug(key)}`,
    className: index === 0 ? "" : "",
  }));
}
