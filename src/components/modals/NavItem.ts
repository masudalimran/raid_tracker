export interface NavItemBadge {
  label: string;
  tone: "success" | "warning";
  title?: string;
}

/** One slot in an area's team-size-wide build-status bar. "empty" = no champion assigned to that slot. */
export type AreaBuildSlotStatus = "built" | "needs_improvement" | "needs_level" | "not_built" | "untouched" | "empty";

export interface NavItem {
  name: string;
  path: string;
  className?: string;
  badge?: NavItemBadge;
  buildStatus?: AreaBuildSlotStatus[];
}
