import { useState, useRef, useEffect } from "react";
import { FaArrowDownShortWide, FaArrowUpWideShort } from "react-icons/fa6";
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

export default function SelectChampionFilter({
  filterInfo,
  setFilterInfo,
}: SelectChampionFilterProp) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleFilters = () => setIsOpen((prev) => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  return (
    <div className="flex items-center gap-2 relative" ref={dropdownRef}>
      <button
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition cursor-pointer"
        onClick={toggleFilters}
      >
        Filters {isOpen ? "▲" : "▼"}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 p-4 bg-white border rounded-lg shadow-lg space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Champion Stat */}
          <select
            className="basic-select w-full"
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

          {/* Rarity */}
          <select
            className="basic-select w-full"
            value={filterInfo.rarity}
            onChange={(e) =>
              handleChange(
                "rarity",
                e.target.value as ChampionRarity | "All Rarity",
              )
            }
          >
            <option value="rarity_all">All Rarity</option>
            {Object.entries(ChampionRarity).map(([key, label]) => (
              <option key={key} value={label}>
                {label}
              </option>
            ))}
          </select>

          {/* Types */}
          <select
            className="basic-select w-full"
            value={filterInfo.type}
            onChange={(e) =>
              handleChange("type", e.target.value as ChampionType | "All Type")
            }
          >
            <option value="type_all">All Type</option>
            {Object.entries(ChampionType).map(([key, label]) => (
              <option key={key} value={label}>
                {label}
              </option>
            ))}
          </select>

          {/* Roles */}
          <select
            className="basic-select w-full"
            value={filterInfo.role}
            onChange={(e) =>
              handleChange("role", e.target.value as ChampionRole | "All Role")
            }
          >
            <option value="role_all">All Role</option>
            {Object.entries(ChampionRole).map(([key, label]) => (
              <option key={key} value={label}>
                {label}
              </option>
            ))}
          </select>

          {/* Factions */}
          <select
            className="basic-select w-full"
            value={filterInfo.faction}
            onChange={(e) =>
              handleChange(
                "faction",
                e.target.value as ChampionFaction | "All Faction",
              )
            }
          >
            <option value="faction_all">All Faction</option>
            {Object.entries(ChampionFaction).map(([key, label]) => (
              <option key={key} value={label}>
                {label}
              </option>
            ))}
          </select>

          {/* Buffs */}
          <select
            className="basic-select w-full"
            value={filterInfo.buff ?? ""}
            onChange={(e) => handleChange("buff", e.target.value || undefined)}
          >
            <option value="">Select Buff</option>
            {buffs.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Debuffs */}
          <select
            className="basic-select w-full"
            value={filterInfo.debuff ?? ""}
            onChange={(e) =>
              handleChange("debuff", e.target.value || undefined)
            }
          >
            <option value="">Select Debuff</option>
            {debuffs.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Auras */}
          <select
            className="basic-select w-full"
            value={filterInfo.aura ?? ""}
            onChange={(e) => handleChange("aura", e.target.value || undefined)}
          >
            <option value="">Select Aura</option>
            {auras.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort Order */}
      {filterInfo.sortOrder === "asc" ? (
        <FaArrowDownShortWide
          title="Filter-Ascending"
          size={34}
          className="cursor-pointer hover:text-gray-500 transition"
          onClick={() => handleSortOrderChange("desc")}
        />
      ) : (
        <FaArrowUpWideShort
          title="Filter-Ascending"
          size={34}
          className="cursor-pointer hover:text-gray-500 transition"
          onClick={() => handleSortOrderChange("asc")}
        />
      )}
    </div>
  );
}
