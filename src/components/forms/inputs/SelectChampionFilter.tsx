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

interface SelectChampionFilterProp {
  filterInfo: ChampionFilter;
  setFilterInfo: Dispatch<SetStateAction<ChampionFilter>>;
}

export default function SelectChampionFilter({
  filterInfo,
  setFilterInfo,
}: SelectChampionFilterProp) {
  const handleStatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as FilterStat;
    setFilterInfo({
      ...filterInfo,
      stat: selected,
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ChampionType | "All Type";
    setFilterInfo({
      ...filterInfo,
      type: selected,
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ChampionRole | "All Role";
    setFilterInfo({
      ...filterInfo,
      role: selected,
    });
  };

  const handleFactionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ChampionFaction | "All Faction";
    setFilterInfo({
      ...filterInfo,
      faction: selected,
    });
  };

  const handleRarityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ChampionRarity | "All Rarity";
    setFilterInfo({
      ...filterInfo,
      rarity: selected,
    });
  };

  const handleSortOrderChange = (sortOrder: "asc" | "desc") => {
    setFilterInfo({
      ...filterInfo,
      sortOrder,
    });
  };

  return (
    <>
      {/* Champion Stat */}
      <div className="mb-0">
        <select
          className="basic-select"
          value={filterInfo.stat}
          onChange={handleStatChange}
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
        </select>
      </div>

      {/* Champion Rarity */}
      <div className="mb-0">
        <select
          className="basic-select"
          value={filterInfo.rarity}
          onChange={handleRarityChange}
        >
          <option value="rarity_all">All Rarity</option>
          {Object.entries(ChampionRarity).map(([key, label]) => (
            <option key={key} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Champion Types */}
      <div className="mb-0">
        <select
          className="basic-select"
          value={filterInfo.type}
          onChange={handleTypeChange}
        >
          <option value="type_all">All Type</option>
          {Object.entries(ChampionType).map(([key, label]) => (
            <option key={key} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Champion Roles */}
      <div className="mb-0">
        <select
          className="basic-select"
          value={filterInfo.role}
          onChange={handleRoleChange}
        >
          <option value="role_all">All Role</option>
          {Object.entries(ChampionRole).map(([key, label]) => (
            <option key={key} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Champion Faction */}
      <div className="mb-0">
        <select
          className="basic-select"
          value={filterInfo.faction}
          onChange={handleFactionChange}
        >
          <option value="faction_all">All Faction</option>
          {Object.entries(ChampionFaction).map(([key, label]) => (
            <option key={key} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

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
    </>
  );
}
