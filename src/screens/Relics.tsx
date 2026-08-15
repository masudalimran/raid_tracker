import { useEffect, useMemo, useState } from "react";
import { GiGemNecklace } from "react-icons/gi";
import ArcaneLoader from "../components/loaders/ArcaneLoader";
import ChampionCard from "../components/card/ChampionCard";
import Modal from "../components/modals/Modal";
import Tooltip from "../components/utility/Tooltip";
import { generateChampions } from "../helpers/handleChampions";
import { getRelicImagePath } from "../helpers/getRelicImage";
import { RELIC_RARITY_BORDER } from "../helpers/relicRarityBorder";
import { RELICS } from "../data/relics";
import { RelicGroup } from "../models/IRelic";
import { ChampionRarity } from "../models/ChampionRarity";
import type IChampion from "../models/IChampion";

const RELIC_GROUP_ORDER: RelicGroup[] = [
  RelicGroup.STANDARD,
  RelicGroup.CHIMERA,
  RelicGroup.CLAN,
  RelicGroup.LIVE_ARENA,
  RelicGroup.FACTION_WARS,
  RelicGroup.GRIM_FOREST,
  RelicGroup.FORGE_PASS,
  RelicGroup.EVENT,
];

const RARITY_BADGE: Record<string, string> = {
  [ChampionRarity.MYTHICAL]:  "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  [ChampionRarity.LEGENDARY]: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  [ChampionRarity.EPIC]:      "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  [ChampionRarity.RARE]:      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
};

const MAX_AVATARS = 6;

export default function Relics() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<IChampion[]>([]);
  const [search, setSearch] = useState("");
  const [previewChampion, setPreviewChampion] = useState<IChampion | null>(null);

  useEffect(() => {
    const load = async () => {
      setChampions(await generateChampions());
      setLoading(false);
    };
    load();
  }, []);

  const championsByRelic = useMemo(() => {
    const map = new Map<string, IChampion[]>();
    for (const c of champions) {
      if (!c.relic) continue;
      const list = map.get(c.relic) ?? [];
      list.push(c);
      map.set(c.relic, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [champions]);

  const filteredRelics = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return RELICS;
    return RELICS.filter((r) => r.name.toLowerCase().includes(lower));
  }, [search]);

  const equippedCount = champions.filter((c) => !!c.relic).length;

  if (loading) return <ArcaneLoader label="Loading relics" />;

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GiGemNecklace className="text-amber-500" size={22} />
            Relics
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            All {RELICS.length} relics — {equippedCount} of your champions currently have one equipped.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search relics…"
          className="basic-input w-full sm:w-64 pr-3"
        />
      </div>

      <div className="space-y-6">
        {RELIC_GROUP_ORDER.map((group) => {
          const relicsInGroup = filteredRelics.filter((r) => r.group === group);
          if (relicsInGroup.length === 0) return null;
          return (
            <section key={group} className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{group}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {relicsInGroup.map((relic) => {
                  const users = championsByRelic.get(relic.id) ?? [];
                  return (
                    <div
                      key={relic.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex gap-3"
                    >
                      <img
                        src={getRelicImagePath(relic.id)}
                        alt={relic.name}
                        className={`w-14 h-14 rounded-lg object-cover border-2 shrink-0 ${RELIC_RARITY_BORDER[relic.rarity]}`}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{relic.name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${RARITY_BADGE[relic.rarity] ?? ""}`}>
                            {relic.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{relic.description}</p>

                        {users.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {users.slice(0, MAX_AVATARS).map((c) => (
                              <Tooltip key={c.id} content={c.name}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewChampion(c)}
                                  className="block rounded-full cursor-pointer hover:ring-2 hover:ring-amber-400 transition"
                                >
                                  {c.imgUrl ? (
                                    <img
                                      src={c.imgUrl}
                                      alt={c.name}
                                      className="w-5 h-5 rounded-full object-cover object-top"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                                  )}
                                </button>
                              </Tooltip>
                            ))}
                            {users.length > MAX_AVATARS && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                +{users.length - MAX_AVATARS}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-300 dark:text-gray-600 pt-0.5">Not equipped by anyone</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {previewChampion && (
        <Modal isOpen bare maxWidthClass="max-w-xs" onClose={() => setPreviewChampion(null)}>
          <ChampionCard champion={previewChampion} />
        </Modal>
      )}
    </div>
  );
}
