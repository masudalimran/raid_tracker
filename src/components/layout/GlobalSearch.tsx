import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import type IChampion from "../../models/IChampion";
import { ALL_AREAS } from "../../data/allAreas";

interface ResultItem {
  key: string;
  label: string;
  sub: string;
  path: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);

    document.addEventListener("keydown", handleShortcut);
    window.addEventListener("open-global-search", handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
      window.removeEventListener("open-global-search", handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const champions: IChampion[] = JSON.parse(
      localStorage.getItem("supabase_champion_list") ?? "[]",
    );

    const championResults: ResultItem[] = champions
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((c) => ({
        key: `champion-${c.id}`,
        label: c.name,
        sub: c.rarity,
        path: `/champions?q=${encodeURIComponent(c.name)}`,
      }));

    const areaResults: ResultItem[] = ALL_AREAS.filter((a) =>
      a.name.toLowerCase().includes(q),
    )
      .slice(0, 8)
      .map((a) => ({
        key: `area-${a.key}`,
        label: a.name,
        sub: "Team",
        path: `/${a.path}`,
      }));

    return [...championResults, ...areaResults];
  }, [query]);

  const select = (item: ResultItem) => {
    navigate(item.path);
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[activeIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-24 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <FaSearch className="text-gray-400 shrink-0" size={14} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search champions or teams…"
            className="flex-1 outline-none text-sm text-gray-900 dark:text-gray-100 bg-transparent"
            autoComplete="off"
          />
          <kbd className="text-[10px] font-semibold text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-1">
            {results.map((item, i) => (
              <li
                key={item.key}
                onMouseDown={() => select(item)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center justify-between gap-2 px-4 py-2 cursor-pointer text-sm transition
                  ${i === activeIndex ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <span className="truncate">{item.label}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{item.sub}</span>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && results.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">No matches found.</p>
        )}
      </div>
    </div>
  );
}
