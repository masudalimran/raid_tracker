import { Fragment, useMemo, useState } from "react";
import type IChampion from "../../../models/IChampion";
import colorByRarity from "../../../helpers/colorByRarity";
import { HiOutlineExternalLink } from "react-icons/hi";
import { checkIfChampionIsBuilt } from "../../../helpers/checkIfChampionIsBuilt";
import { ChampionRoleImageMap } from "../../../models/ChampionRole";

interface ChampionMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  champions: IChampion[];
  max?: number;
}

export default function ChampionMultiSelect({
  value,
  onChange,
  champions,
  max = 6,
}: ChampionMultiSelectProps) {
  const [query, setQuery] = useState("");

  const toggleChampion = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  };

  const filtered = useMemo(() => {
    return champions.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [champions, query]);

  const selectedChampions = useMemo(() => {
    return champions
      .filter((c) => value.includes(c.id?.toString() ?? ""))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [champions, value]);

  const unselectedChampions = useMemo(() => {
    return filtered
      .filter((c) => !value.includes(c.id?.toString() ?? ""))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, value]);

  const ChampionRow = ({ champ }: { champ: IChampion }) => {
    if (!champ.id) return null;

    const id = champ.id.toString();
    const checked = value.includes(id);

    return (
      <div className="flex items-center gap-1 w-full pr-4">
        <label
          className={`flex-1 flex items-center gap-2 cursor-pointer basic-padding-xs ${colorByRarity(
            champ.rarity,
          )}`}
        >
          <div className="flex-1 flex justify-start items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleChampion(id)}
            />
            <div>
              <img
                src={champ.imgUrl}
                className={`h-7 w-7 object-cover rounded-full border-2 ${
                  checkIfChampionIsBuilt(champ)
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              />
            </div>
            {champ.name}
          </div>

          <div className="flex gap-1">
            {champ.role
              .filter((role) => ChampionRoleImageMap[role])
              .map((role) => (
                <div
                  key={role}
                  className="w-5 h-5 flex-center text-xs rounded-full"
                  title={role}
                >
                  <img
                    src={ChampionRoleImageMap[role]}
                    alt={role}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              ))}
          </div>
        </label>

        <a
          href={champ.championUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${colorByRarity(
            champ.rarity,
          )} h-9 w-9 flex-center hover:opacity-75 transition`}
        >
          <HiOutlineExternalLink />
        </a>
      </div>
    );
  };

  return (
    <div className="border rounded p-2">
      {/* Selected Champions */}
      {selectedChampions.length > 0 && (
        <div className="mb-3 border-b pb-2">
          <p className="text-xs font-semibold mb-1">
            Selected Champions ({value.length}/{max})
          </p>
          <div className="space-y-1">
            {selectedChampions.map((champ) => (
              <Fragment key={champ.id}>
                <ChampionRow champ={champ} />
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search champions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border px-2 py-1 rounded mb-2"
      />

      {/* Available Champions */}
      <div className="max-h-50 overflow-y-auto space-y-1">
        {unselectedChampions.map((champ) => (
          <Fragment key={champ.id}>
            <ChampionRow champ={champ} />
          </Fragment>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Selected {value.length} / {max}
      </p>
    </div>
  );
}
