import { useState, useRef, useEffect } from "react";
import { FaArrowDownShortWide, FaArrowUpWideShort, FaFilter } from "react-icons/fa6";
import { ChampionFaction } from "../../../models/ChampionFaction";
import { ChampionType } from "../../../models/ChampionType";
import type {
  ChampionFilter,
  FilterStat,
} from "../../../models/ChampionFilter";
import type { Dispatch, SetStateAction } from "react";
import { ChampionRarity } from "../../../models/ChampionRarity";
import { ChampionRole } from "../../../models/ChampionRole";
import { buffs } from "../../../data/buffs";
import { debuffs } from "../../../data/debuffs";
import { auras } from "../../../data/auras";

interface SelectChampionFilterProp {
  filterInfo: ChampionFilter;
  setFilterInfo: Dispatch<SetStateAction<ChampionFilter>>;
}

const INITIAL_FILTER: Partial<ChampionFilter> = {
  rarity: "rarity_all",
  type: "type_all",
  role: "role_all",
  faction: "faction_all",
  buff: "",
  debuff: "",
  aura: "",
};

export default function SelectChampionFilter({
  filterInfo,
  setFilterInfo,
}: SelectChampionFilterProp) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = <T extends string | undefined>(
    key: keyof ChampionFilter,
    value: T,
  ) => {
    setFilterInfo({ ...filterInfo, [key]: value });
  };

  const handleSortOrderChange = (sortOrder: "asc" | "desc") => {
    setFilterInfo({ ...filterInfo, sortOrder });
  };

  // Count how many non-default filters are active
  const activeFilterCount = [
    filterInfo.rarity !== "rarity_all",
    filterInfo.type !== "type_all",
    filterInfo.role !== "role_all",
    filterInfo.faction !== "faction_all",
    !!filterInfo.buff,
    !!filterInfo.debuff,
    !!filterInfo.aura,
  ].filter(Boolean).length;

  const isDesc = filterInfo.sortOrder === "desc";

  return (
    <div className="flex items-center gap-1.5 relative" ref={dropdownRef}>

      {/* ── Filters trigger button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer
          ${isOpen
            ? "bg-amber-500 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600"
          }`}
      >
        <FaFilter size={11} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-white/10">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Filter & Sort
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFilterInfo((prev) => ({ ...prev, ...INITIAL_FILTER }))
                }
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="p-3 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* Sort by */}
            <div>
              <p className="section-label mb-1.5">Sort By</p>
              <select
                className="basic-select"
                value={filterInfo.stat}
                onChange={(e) => handleChange("stat", e.target.value as FilterStat)}
              >
                <option value="name">Name</option>
                <option value="hp">HP</option>
                <option value="atk">ATK</option>
                <option value="def">DEF</option>
                <option value="spd">SPD</option>
                <option value="c_rate">C.Rate</option>
                <option value="c_dmg">C.DMG</option>
                <option value="res">RES</option>
                <option value="acc">ACC</option>
                <option value="level">Level</option>
                <option value="ascension_stars">Ascension Stars</option>
                <option value="awaken_stars">Awaken Stars</option>
                <option value="book_priority">Book Priority</option>
                <option value="mastery_priority">Mastery Priority</option>
                <option value="champion_impact">Champion Impact</option>
              </select>
            </div>

            {/* Attribute filters */}
            <div>
              <p className="section-label mb-1.5">Attributes</p>
              <div className="space-y-2">
                <select
                  className="basic-select"
                  value={filterInfo.rarity}
                  onChange={(e) =>
                    handleChange("rarity", e.target.value as ChampionRarity | "All Rarity")
                  }
                >
                  <option value="rarity_all">All Rarities</option>
                  {Object.entries(ChampionRarity).map(([key, label]) => (
                    <option key={key} value={label}>{label}</option>
                  ))}
                </select>

                <select
                  className="basic-select"
                  value={filterInfo.type}
                  onChange={(e) =>
                    handleChange("type", e.target.value as ChampionType | "All Type")
                  }
                >
                  <option value="type_all">All Types</option>
                  {Object.entries(ChampionType).map(([key, label]) => (
                    <option key={key} value={label}>{label}</option>
                  ))}
                </select>

                <select
                  className="basic-select"
                  value={filterInfo.role}
                  onChange={(e) =>
                    handleChange("role", e.target.value as ChampionRole | "All Role")
                  }
                >
                  <option value="role_all">All Roles</option>
                  {Object.entries(ChampionRole).map(([key, label]) => (
                    <option key={key} value={label}>{label}</option>
                  ))}
                </select>

                <select
                  className="basic-select"
                  value={filterInfo.faction}
                  onChange={(e) =>
                    handleChange("faction", e.target.value as ChampionFaction | "All Faction")
                  }
                >
                  <option value="faction_all">All Factions</option>
                  {Object.entries(ChampionFaction).map(([key, label]) => (
                    <option key={key} value={label}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skill filters */}
            <div>
              <p className="section-label mb-1.5">Skills</p>
              <div className="space-y-2">
                <select
                  className="basic-select"
                  value={filterInfo.buff ?? ""}
                  onChange={(e) => handleChange("buff", e.target.value || undefined)}
                >
                  <option value="">Any Buff</option>
                  {buffs.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <select
                  className="basic-select"
                  value={filterInfo.debuff ?? ""}
                  onChange={(e) => handleChange("debuff", e.target.value || undefined)}
                >
                  <option value="">Any Debuff</option>
                  {debuffs.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                  className="basic-select"
                  value={filterInfo.aura ?? ""}
                  onChange={(e) => handleChange("aura", e.target.value || undefined)}
                >
                  <option value="">Any Aura</option>
                  {auras.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sort order toggle ── */}
      <button
        type="button"
        title={isDesc ? "Descending — click for ascending" : "Ascending — click for descending"}
        onClick={() => handleSortOrderChange(isDesc ? "asc" : "desc")}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg
                   border border-gray-200 bg-white text-gray-600
                   hover:border-amber-400 hover:text-amber-600
                   transition cursor-pointer"
      >
        {isDesc ? (
          <><FaArrowUpWideShort size={14} /><span className="hidden sm:inline">Desc</span></>
        ) : (
          <><FaArrowDownShortWide size={14} /><span className="hidden sm:inline">Asc</span></>
        )}
      </button>
    </div>
  );
}
