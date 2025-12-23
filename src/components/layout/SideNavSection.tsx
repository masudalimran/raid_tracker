import { Link } from "react-router-dom";
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

  // If no section name → always open (Core menu)
  const isCollapsible = Boolean(sectionName);

  return (
    <li className="list-none">
      {sectionName && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="cursor-pointer w-full text-left font-semibold py-2 px-1 flex justify-between items-center hover:bg-orange-200"
        >
          <span>{sectionName}</span>
          <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
        </button>
      )}

      {(isOpen || !isCollapsible) && (
        <ul className="pl-2">
          {items.map((item) => (
            <Link key={item.name} to={item.path}>
              <li
                className={`${item.className} cursor-pointer border-b-2 hover:border-black
                border-orange-100 w-full text-nowrap `}
              >
                {item.name}
              </li>
            </Link>
          ))}
        </ul>
      )}
    </li>
  );
}
