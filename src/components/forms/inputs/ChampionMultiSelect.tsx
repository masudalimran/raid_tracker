import { Fragment, useState } from "react";
import type IChampion from "../../../models/IChampion";

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

  const filtered = champions.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggleChampion = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  };

  return (
    <div className="border rounded p-2">
      <input
        type="text"
        placeholder="Search champions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border px-2 py-1 rounded mb-2"
      />

      <div className="max-h-62.5 overflow-y-auto space-y-1">
        {filtered
          .slice() // make a copy to avoid mutating original array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((champ) =>
            champ.id ? (
              <Fragment>
                <label
                  key={champ.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(champ.id.toString())}
                    onChange={() =>
                      champ.id && toggleChampion(champ.id.toString())
                    }
                  />
                  {champ.name}
                </label>
              </Fragment>
            ) : (
              <p>Champion Id Does Not Exist!!</p>
            )
          )}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Selected {value.length} / {max}
      </p>
    </div>
  );
}
