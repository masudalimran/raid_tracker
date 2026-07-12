export interface NavItemBadge {
  label: string;
  tone: "success" | "warning";
  title?: string;
}

export interface NavItem {
  name: string;
  path: string;
  className?: string;
  badge?: NavItemBadge;
}
