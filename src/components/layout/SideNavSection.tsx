import { NavLink } from "react-router-dom";
import type { NavItem } from "../modals/NavItem";
import Tooltip from "../utility/Tooltip";

interface SideNavSectionProps {
  items: NavItem[];
  sectionName?: string;
  isOpen: boolean;
  onToggle?: () => void;
  /** Never collapses and isn't part of the accordion — e.g. Core. */
  alwaysOpen?: boolean;
}

export function SideNavSection({
  items,
  sectionName,
  isOpen,
  onToggle,
  alwaysOpen,
}: SideNavSectionProps) {
  const isCollapsible = Boolean(sectionName) && !alwaysOpen;

  return (
    <li className="list-none">
      {sectionName && (
        isCollapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="w-full text-left flex justify-between items-center
                       px-2 py-2 rounded-md transition cursor-pointer
                       text-[10px] font-semibold uppercase tracking-wider
                       text-gray-500 hover:text-amber-400 hover:bg-white/5"
          >
            <span>{sectionName}</span>
            <span className="text-[9px] opacity-60">{isOpen ? "▲" : "▼"}</span>
          </button>
        ) : (
          <p
            className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500"
          >
            {sectionName}
          </p>
        )
      )}

      {(isOpen || !isCollapsible) && (
        <ul className="pl-1 pb-1">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block text-sm py-1.5 px-2 rounded-md transition cursor-pointer
                 ${isActive
                   ? "text-amber-400 font-semibold bg-white/10 border-l-2 border-amber-400"
                   : "text-gray-400 hover:text-amber-300 hover:bg-white/5 border-l-2 border-transparent"
                 }`
              }
            >
              <li className="flex items-center justify-between gap-2 w-full">
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <Tooltip content={item.badge.title} position="right">
                    <span
                      className={`shrink-0 text-[9px] font-bold leading-none px-1.5 py-1 rounded-full
                        ${item.badge.tone === "success"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                        }`}
                    >
                      {item.badge.label}
                    </span>
                  </Tooltip>
                )}
              </li>
            </NavLink>
          ))}
        </ul>
      )}
    </li>
  );
}
