import { useEffect, useRef, useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { fromSlug } from "../../../helpers/fromSlug";
import type ITeam from "../../../models/ITeam";

interface ImportTeamPickerProps {
  /** Candidate teams — already scoped to the current user/account and excluding this area's own team. */
  teams: ITeam[];
  onImport: (team: ITeam) => void;
}

/** Searchable picker for copying another area's team roster into this one — e.g. importing Spirit Potion's team while editing Arcane Potion, or a Normal-mode team while editing its Hard-mode counterpart. */
export default function ImportTeamPicker({ teams, onImport }: ImportTeamPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const query = useDebouncedValue(queryInput, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQueryInput("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const q = query.trim().toLowerCase();
  const matches = teams
    .filter((t) => fromSlug(t.team_name).toLowerCase().includes(q))
    .sort((a, b) => fromSlug(a.team_name).localeCompare(fromSlug(b.team_name)));

  const handlePick = (team: ITeam) => {
    onImport(team);
    setIsOpen(false);
    setQueryInput("");
  };

  if (teams.length === 0) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setQueryInput("");
        }}
        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium underline cursor-pointer"
      >
        <FaExchangeAlt size={10} /> Import Team…
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search teams…"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {matches.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No matching teams</p>
            ) : (
              matches.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handlePick(t)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{fromSlug(t.team_name)}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {t.champion_ids.length} champ{t.champion_ids.length !== 1 ? "s" : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
