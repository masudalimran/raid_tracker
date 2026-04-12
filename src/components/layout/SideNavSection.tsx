import { NavLink } from "react-router-dom";
import { useState } from "react";
import type { NavItem } from "../modals/NavItem";

interface SideNavSectionProps {
  items: NavItem[];
  sectionName?: string;
  defaultOpen?: boolean;
}

export function SideNavSection({
  items,
  sectionName,
  defaultOpen = false,
}: SideNavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isCollapsible = Boolean(sectionName);

  return (
    <li className="list-none">
      {sectionName && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full text-left flex justify-between items-center
                     px-2 py-2 rounded-md transition cursor-pointer
                     text-[10px] font-semibold uppercase tracking-wider
                     text-gray-500 hover:text-amber-400 hover:bg-white/5"
        >
          <span>{sectionName}</span>
          <span className="text-[9px] opacity-60">{isOpen ? "▲" : "▼"}</span>
        </button>
      )}

      {(isOpen || !isCollapsible) && (
        <ul className="pl-1 pb-1">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block text-sm py-1.5 px-2 rounded-md transition cursor-pointer text-nowrap
                 ${isActive
                   ? "text-amber-400 font-semibold bg-white/10 border-l-2 border-amber-400"
                   : "text-gray-400 hover:text-amber-300 hover:bg-white/5 border-l-2 border-transparent"
                 }`
              }
            >
              <li>{item.name}</li>
            </NavLink>
          ))}
        </ul>
      )}
    </li>
  );
}
