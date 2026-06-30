import { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { ROLE_CATEGORIES } from "../../../data/roleCategories";
import { ChampionRoleImageMap } from "../../../models/ChampionRole";
import type { ChampionRole } from "../../../models/ChampionRole";

interface RoleSearchSelectProps {
  excludeRoles: string[];
  onSelect: (role: ChampionRole) => void;
}

/** Searchable, grouped role picker — replaces a single long native <select>. */
export default function RoleSearchSelect({ excludeRoles, onSelect }: RoleSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROLE_CATEGORIES.map(({ label, roles }) => ({
      label,
      roles: roles.filter(
        (r) => !excludeRoles.includes(r) && r.toLowerCase().includes(q),
      ),
    })).filter((group) => group.roles.length > 0);
  }, [query, excludeRoles]);

  const handlePick = (role: ChampionRole) => {
    onSelect(role);
    setQuery("");
    searchRef.current?.focus();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setQuery("");
        }}
        className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold border border-amber-200 rounded-full px-2 py-0.5 bg-amber-50 hover:bg-amber-100 transition cursor-pointer"
      >
        <FaPlus size={9} /> Add role…
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search roles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No matching roles</p>
            ) : (
              groups.map(({ label, roles }) => (
                <div key={label}>
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    {label}
                  </p>
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handlePick(role)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer text-left"
                    >
                      <img
                        src={ChampionRoleImageMap[role]}
                        alt=""
                        className="w-4 h-4 object-contain rounded-full shrink-0"
                      />
                      <span className="truncate">{role}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
